import type { FastifyInstance } from 'fastify'
import { db } from '@sofia/db'

export async function adminUsersRoute(app: FastifyInstance) {
  app.get('/users', async (req, reply) => {
    const { limit = '50' } = req.query as Record<string, string>
    const { data } = await db
      .from('users')
      .select('*, user_profiles(*)')
      .order('last_seen', { ascending: false })
      .limit(+limit)
    return data ?? []
  })

  app.get<{ Params: { id: string } }>('/users/:id/profile', async (req, reply) => {
    const { data } = await db
      .from('user_profiles')
      .select('*')
      .eq('bitrix_user_id', req.params.id)
      .single()
    if (!data) return reply.code(404).send({ error: 'Profile not found' })
    return data
  })
}
