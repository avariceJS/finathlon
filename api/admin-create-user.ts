import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const LOGIN_DOMAIN = 'login.finathlon'

function normalizeUsername(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (s.length < 3 || s.length > 32) return null
  return s
}

function syntheticEmail(norm: string): string {
  return `${norm}@${LOGIN_DOMAIN}`
}

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

  const password = String(body.password ?? '')
  const firstName = String(body.firstName ?? '').trim()
  const lastName = String(body.lastName ?? '').trim()
  const kind = String(body.kind ?? 'email')

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Пароль не короче 6 символов' })
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let email: string
  let meta: Record<string, string | undefined>

  if (kind === 'username') {
    const norm = normalizeUsername(String(body.username ?? ''))
    if (!norm) {
      return res.status(400).json({
        error:
          'Логин: 3–32 символа, строчные латинские буквы, цифры и знак подчёркивания',
      })
    }
    const { data: exists } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', norm)
      .maybeSingle()
    if (exists) {
      return res.status(400).json({ error: 'Такой логин уже занят' })
    }
    email = syntheticEmail(norm)
    meta = {
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      username: norm,
    }
  } else {
    email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    if (!email) {
      return res.status(400).json({ error: 'Укажите email' })
    }
    if (email.endsWith(`@${LOGIN_DOMAIN}`)) {
      return res.status(400).json({ error: 'Недопустимый адрес почты' })
    }
    meta = {
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    }
  }

  const { data: created, error: createErr } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: meta,
    })

  if (createErr) {
    return res.status(400).json({ error: createErr.message })
  }

  return res.status(200).json({ userId: created.user.id })
}
