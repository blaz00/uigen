'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error) throw new Error('Project not found')
  return {
    id: data.id,
    name: data.name,
    messages: data.messages ?? [],
    data: data.data ?? {},
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}
