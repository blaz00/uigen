import type { FileNode } from '@/lib/file-system'
import { VirtualFileSystem } from '@/lib/file-system'
import { streamText } from 'ai'
import { buildStrReplaceTool } from '@/lib/tools/str-replace'
import { buildFileManagerTool } from '@/lib/tools/file-manager'
import { getLanguageModel } from '@/lib/provider'
import { generationPrompt } from '@/lib/prompts/generation'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages, files, projectId }:
    { messages: any[]; files: Record<string, FileNode>; projectId?: string } = await req.json()

  messages.unshift({
    role: 'system',
    content: generationPrompt,
    providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
  })

  const fileSystem = new VirtualFileSystem()
  fileSystem.deserializeFromNodes(files)

  const model = getLanguageModel()
  const isMockProvider = !process.env.ANTHROPIC_API_KEY

  const result = streamText({
    model: model as any,
    messages,
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
          ...messages.filter(m => m.role !== 'system'),
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

  return (result as any).toUIMessageStreamResponse?.() ?? result.toTextStreamResponse()
}

export const maxDuration = 120
