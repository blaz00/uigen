'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProjects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  }))
}
