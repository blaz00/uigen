'use server'

import { createClient } from '@/lib/supabase/server'

interface CreateProjectInput {
  name: string
  messages: any[]
  data: Record<string, any>
}

export async function createProject(input: CreateProjectInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: input.name,
      messages: input.messages,
      data: input.data,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
