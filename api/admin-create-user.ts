import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return res.status(500).json({
      error:
        'Сервер не настроен: задайте VITE_SUPABASE_URL, VITE_SUPABASE_KEY и SUPABASE_SERVICE_ROLE_KEY',
    })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) {
    return res.status(401).json({ error: 'Сессия недействительна' })
  }

  const { data: profile, error: profileErr } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profileErr || profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }

  const rawBody = req.body
  const body =
    typeof rawBody === 'string'
      ? (JSON.parse(rawBody) as Record<string, unknown>)
      : ((rawBody ?? {}) as Record<string, unknown>)

  const email = String(body.email ?? '')
    .trim()
    .toLowerCase()
  const password = String(body.password ?? '')
  const firstName = String(body.firstName ?? '').trim()
  const lastName = String(body.lastName ?? '').trim()

  if (!email || !password) {
    return res.status(400).json({ error: 'Укажите email и пароль' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль не короче 6 символов' })
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: created, error: createErr } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      },
    })

  if (createErr) {
    return res.status(400).json({ error: createErr.message })
  }

  return res.status(200).json({ userId: created.user.id })
}
