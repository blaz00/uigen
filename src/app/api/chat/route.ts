import type { FileNode } from '@/lib/file-system'
import { VirtualFileSystem } from '@/lib/file-system'
import { streamText, convertToModelMessages } from 'ai'
import type { UIMessage } from 'ai'
import { buildStrReplaceTool } from '@/lib/tools/str-replace'
import { buildFileManagerTool } from '@/lib/tools/file-manager'
import { getLanguageModel } from '@/lib/provider'
import { generationPrompt } from '@/lib/prompts/generation'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  console.log('[/api/chat] POST received')
  try {
  const { messages, files, projectId }:
    { messages: UIMessage[]; files: Record<string, FileNode>; projectId?: string } = await req.json()

  const fileSystem = new VirtualFileSystem()
  fileSystem.deserializeFromNodes(files)

  const model = getLanguageModel()
  const isMockProvider = !process.env.ANTHROPIC_API_KEY

  const supportedMessages = messages.filter((m: any) => ['user', 'assistant', 'system'].includes(m.role))
  const modelMessages = await convertToModelMessages(supportedMessages)

  const result = streamText({
    model: model as any,
    system: generationPrompt,
    messages: modelMessages,
    maxOutputTokens: 10_000,
    stopWhen: (state: any) => state.steps.length >= (isMockProvider ? 4 : 40),
    onError: (err: any) => console.error(err),
    tools: {
      str_replace_editor: buildStrReplaceTool(fileSystem),
      file_manager: buildFileManagerTool(fileSystem),
    },
    onFinish: async ({ response }) => {
      if (!projectId) return
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const allMessages = [
          ...messages,
          ...(response.messages ?? []),
        ]

        await supabase.from('projects').update({
          messages: allMessages,
          data: fileSystem.serialize(),
          updated_at: new Date().toISOString(),
        }).eq('id', projectId).eq('user_id', user.id)
      } catch (err) {
        console.error('Failed to save project:', err)
      }
    },
  })

  return result.toUIMessageStreamResponse()
  } catch (err: any) {
    console.error('[/api/chat] Fatal error:', err)
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const maxDuration = 120
