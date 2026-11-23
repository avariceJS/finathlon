const { test, expect } = require('@playwright/test')

const adminId = '33333333-3333-4333-8333-333333333333'
const eventId = '44444444-4444-4444-8444-444444444444'
const admin = {
  id: adminId,
  email: 'admin@example.test',
  role: 'admin',
  first_name: 'Тестовый',
  last_name: 'Администратор',
}
const base = {
  id: eventId,
  slug: 'test-olympiad',
  title: 'Финатлон — проверка олимпиады',
  profile_title: 'Финансовая грамотность',
  description: 'Описание направления',
  season: '2026–2027',
  year: 2026,
  format: 'online',
  status: 'published',
  start_date: '2026-11-17',
  end_date: '2026-11-17',
  max_participants: 100,
  is_published: true,
  registration_open: true,
  rich_content:
    '<p>Условия участия</p><img src=x onerror="window.__xss=true"><a href="javascript:window.__xss=true">Вредная ссылка</a>',
  created_at: '2026-11-17T00:00:00Z',
  updated_at: '2026-11-17T00:00:00Z',
}

async function mockApi(
  page,
  { role, olympiads = [base], writes = [], legacySchema = false } = {},
) {
  if (role) {
    await page.addInitScript(
      ({ adminId }) => {
        const expiry = Math.floor(Date.now() / 1000) + 3600
        const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: adminId, exp: expiry, role: 'authenticated' }))}.test`
        localStorage.setItem(
          'sb-example-auth-token',
          JSON.stringify({
            access_token: token,
            refresh_token: 'test',
            token_type: 'bearer',
            expires_at: expiry,
            expires_in: 3600,
            user: {
              id: adminId,
              email: 'admin@example.test',
              aud: 'authenticated',
            },
          }),
        )
      },
      { adminId },
    )
  }
  await page.route('https://example.supabase.co/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/').pop()
    if (
      legacySchema &&
      table === 'olympiads' &&
      url.searchParams.get('select') === 'format,registration_open'
    ) {
      return route.fulfill({
        status: 400,
        json: {
          code: '42703',
          message: 'column olympiads.format does not exist',
        },
      })
    }

    if (url.pathname === '/auth/v1/user') {
      return route.fulfill({
        json: { id: adminId, email: admin.email, aud: 'authenticated' },
      })
    }
    const profile = { ...admin, role: role ?? 'user' }
    let rows =
      table === 'profiles' ? [profile] : table === 'olympiads' ? olympiads : []
    if (['POST', 'PATCH', 'DELETE'].includes(request.method())) {
      const payload = request.postDataJSON()
      writes.push({ table, method: request.method(), payload })
      rows = [{ ...base, ...payload }]
    }
    const single = request
      .headers()
      .accept?.includes('application/vnd.pgrst.object')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(single ? (rows[0] ?? null) : rows),
    })
  })
}

for (const width of [320, 390, 768]) {
  test(`olympiad cards fit ${width}px, hide drafts and sanitize stored HTML`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 700 })
    await mockApi(page, {
      olympiads: [
        base,
        { ...base, id: 'draft', title: 'Скрытый черновик', status: 'draft' },
        {
          ...base,
          id: 'hidden',
          title: 'Скрытая олимпиада',
          is_published: false,
        },
      ],
    })
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Олимпиады и профили' })
    await expect(section.getByText(base.title)).toBeVisible()
    await expect(page.getByText('Скрытый черновик')).toHaveCount(0)
    await expect(page.getByText('Скрытая олимпиада')).toHaveCount(0)
    await section.getByText('Подробнее об олимпиаде').click()
    await expect(
      section.getByText('Условия участия', { exact: true }),
    ).toBeVisible()
    await expect(section.locator('img')).toHaveCount(0)
    await expect(section.getByText('Вредная ссылка')).not.toHaveAttribute(
      'href',
    )
    expect(await page.evaluate(() => window.__xss)).toBeUndefined()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1)
    if (width === 390)
      await page.screenshot({
        path: testInfo.outputPath('olympiads-390.png'),
        fullPage: true,
      })
    await section.getByRole('link', { name: 'Зарегистрироваться' }).click()
    await expect(page).toHaveURL(`/registration?profile=${eventId}`)
    await expect(
      page.getByRole('heading', { name: 'Регистрация участника' }),
    ).toBeVisible()
    await expect(
      page.getByLabel('Профиль олимпиады *', { exact: true }),
    ).toHaveValue(eventId)
  })
}

test('non-admin users cannot open olympiad management', async ({ page }) => {
  await mockApi(page, { role: 'user' })
  await page.goto('/admin/olympiads')
  await expect(page).toHaveURL('/')
  await expect(
    page.getByRole('button', { name: '+ Новая олимпиада' }),
  ).toHaveCount(0)
})

test('admin creates a same-day event and converts optional empty dates to null', async ({
  page,
}) => {
  const writes = []
  await mockApi(page, { role: 'admin', writes })
  await page.goto('/admin/olympiads')
  await page.getByRole('button', { name: '+ Новая олимпиада' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Slug', { exact: true }).fill('new-event')
  await dialog
    .getByLabel('Название олимпиады', { exact: true })
    .fill('Новая олимпиада')
  await dialog.getByLabel('Дата начала', { exact: true }).fill('2026-11-17')
  await dialog.getByLabel('Дата окончания', { exact: true }).fill('2026-11-17')
  await dialog.getByLabel('Вид олимпиады').selectOption('offline')
  await dialog.getByLabel('Статус', { exact: true }).selectOption('published')
  await dialog.getByLabel('Показывать на сайте', { exact: false }).check()
  await dialog.getByLabel('Управление регистрацией').selectOption('closed')
  const editor = dialog.getByRole('textbox', { name: 'Дополнительный текст' })
  await editor.fill('Безопасный текст')
  await dialog.getByRole('button', { name: 'Создать', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(writes).toHaveLength(1)
  expect(writes[0].payload).toMatchObject({
    start_date: '2026-11-17',
    end_date: '2026-11-17',
    format: 'offline',
    registration_open: false,
    is_published: true,
    status: 'published',
  })
  await page.getByRole('button', { name: '+ Новая олимпиада' }).click()
  await dialog.getByLabel('Slug', { exact: true }).fill('no-dates')
  await dialog.getByLabel('Название олимпиады', { exact: true }).fill('Без дат')
  await dialog.getByLabel('Дата начала', { exact: true }).fill('')
  await dialog.getByLabel('Дата окончания', { exact: true }).fill('')
  await dialog.getByRole('button', { name: 'Создать', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(writes[1].payload).toMatchObject({
    start_date: null,
    end_date: null,
    is_published: false,
    status: 'draft',
  })
})

test('copy generates a unique slug, stays a hidden draft and sanitizes editor input', async ({
  page,
}) => {
  const writes = []
  await mockApi(page, { role: 'admin', writes })
  await page.goto('/admin/olympiads')
  await page.getByRole('button', { name: 'Создать копию', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Slug', { exact: true })).toHaveValue(
    /test-olympiad-copy-[a-f0-9]{8}/,
  )
  await expect(dialog.locator('[contenteditable] img')).toHaveCount(0)
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
  await dialog
    .getByRole('button', { name: 'Создать копию', exact: true })
    .click()
  await expect(dialog).toHaveCount(0)
  expect(writes[0].payload).toMatchObject({
    status: 'draft',
    is_published: false,
    registration_open: null,
  })
  expect(writes[0].payload.rich_content).not.toMatch(/onerror|javascript:/)
})

test('invalid date order is rejected before making a request', async ({
  page,
}) => {
  const writes = []
  await mockApi(page, { role: 'admin', writes })
  await page.goto('/admin/olympiads')
  await page.getByRole('button', { name: '+ Новая олимпиада' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Slug', { exact: true }).fill('bad-dates')
  await dialog.getByLabel('Название олимпиады', { exact: true }).fill('Ошибка')
  await dialog.getByLabel('Дата начала', { exact: true }).fill('2026-11-18')
  await dialog.getByLabel('Дата окончания', { exact: true }).fill('2026-11-17')
  await dialog.getByRole('button', { name: 'Создать', exact: true }).click()
  await expect(
    dialog.getByText('Дата окончания не может быть раньше даты начала'),
  ).toBeVisible()
  expect(writes).toHaveLength(0)
})

test('admin chooses participant and olympiad by name', async ({ page }) => {
  const writes = []
  await mockApi(page, { role: 'admin', writes })
  await page.goto('/admin/olympiad-profiles')
  await page.getByRole('button', { name: '+ Новый профиль' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Участник', { exact: true }).selectOption(adminId)
  await dialog.getByLabel('Олимпиада', { exact: true }).selectOption(eventId)
  await dialog.getByLabel('Баллы', { exact: true }).fill('90')
  await dialog.getByRole('button', { name: 'Создать', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(writes[0]).toMatchObject({
    table: 'olympiad_profiles',
    payload: {
      user_id: adminId,
      olympiad_id: eventId,
      olympiad_year: 2026,
      score: 90,
    },
  })
})

test('editing a title preserves optional empty dates and unlimited capacity', async ({
  page,
}) => {
  const writes = []
  await mockApi(page, {
    role: 'admin',
    writes,
    olympiads: [
      { ...base, start_date: null, end_date: null, max_participants: null },
    ],
  })
  await page.goto('/admin/olympiads')
  await page.getByRole('button', { name: 'Редактировать', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Дата начала', { exact: true })).toHaveValue(
    '',
  )
  await expect(
    dialog.getByLabel('Макс. участников', { exact: true }),
  ).toHaveValue('')
  await dialog
    .getByLabel('Название олимпиады', { exact: true })
    .fill('Новое название')
  await dialog.getByRole('button', { name: 'Сохранить', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(writes[0].payload).toMatchObject({
    title: 'Новое название',
    start_date: null,
    end_date: null,
    max_participants: null,
  })
})

test('legacy database keeps new admin pages read-only until upgraded', async ({
  page,
}) => {
  const writes = []
  await mockApi(page, { role: 'admin', writes, legacySchema: true })
  await page.goto('/admin/olympiads')
  await expect(
    page.getByRole('button', { name: '+ Новая олимпиада' }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Редактировать', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByText('Раздел временно доступен только для просмотра.', {
      exact: false,
    }),
  ).toBeVisible()
  await page.goto('/admin/olympiad-profiles')
  await expect(
    page.getByRole('button', { name: '+ Новый профиль' }),
  ).toBeDisabled()
  expect(writes).toHaveLength(0)
})

test('editor sanitizes pasted HTML before inserting it', async ({ page }) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/admin/olympiads')
  await page.getByRole('button', { name: '+ Новая олимпиада' }).click()
  const editor = page.getByRole('textbox', { name: 'Дополнительный текст' })
  await editor.focus()
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData(
      'text/html',
      '<b>Текст</b><img src=x onerror="window.__xss=true"><a href="javascript:alert(1)">Ссылка</a>',
    )
    element.dispatchEvent(
      new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true,
        cancelable: true,
      }),
    )
  })
  await expect(editor).toContainText('Текст')
  await expect(editor.locator('img')).toHaveCount(0)
  await expect(editor.locator('a')).not.toHaveAttribute('href')
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
})

test('new participant can register and open the cabinet after signup', async ({
  page,
}) => {
  const participant = {
    id: adminId,
    email: 'participant@example.test',
    aud: 'authenticated',
  }
  const expiry = Math.floor(Date.now() / 1000) + 3600
  const jwtPart = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const session = {
    access_token: `${jwtPart({ alg: 'HS256', typ: 'JWT' })}.${jwtPart({ sub: adminId, exp: expiry, role: 'authenticated' })}.test`,
    refresh_token: 'test',
    token_type: 'bearer',
    expires_in: 3600,
    user: participant,
  }
  const submissions = []
  await page.route('https://example.supabase.co/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const resource = url.pathname.split('/').pop()
    if (resource === 'signup') {
      expect(url.searchParams.get('redirect_to')).toContain(
        '/registration?profile=' + eventId,
      )
      return route.fulfill({ json: session })
    }
    if (url.pathname === '/auth/v1/user')
      return route.fulfill({ json: participant })
    if (resource === 'register_for_olympiad_profile') {
      submissions.push(request.postDataJSON())
      return route.fulfill({ json: 'test-registration' })
    }
    const rows =
      {
        olympiads: [base],
        profiles: [{ ...admin, email: participant.email, role: 'user' }],
        olympiad_registrations: submissions.length
          ? [
              {
                id: 'test-registration',
                profile_id: eventId,
                created_at: base.created_at,
              },
            ]
          : [],
      }[resource] ?? []
    const single = request
      .headers()
      .accept?.includes('application/vnd.pgrst.object')
    return route.fulfill({ json: single ? (rows[0] ?? null) : rows })
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/registration?profile=' + eventId)
  const values = {
    email: participant.email,
    password: 'test12345',
    passwordConfirm: 'test12345',
    lastName: 'Иванов',
    firstName: 'Иван',
    middleName: 'Иванович',
    birthDate: '2010-01-01',
    phone: '+79990000000',
    postalCode: '101000',
    city: 'Москва',
    address: 'Учебная улица',
    school: 'Учебная школа',
    schoolPhone: '+79990000000',
    schoolAddress: 'Учебная улица',
    schoolEmail: 'school@example.test',
    parentFullName: 'Иванова Анна',
    parentEmail: 'parent@example.test',
    parentPhone: '+79990000000',
    teacherFullName: 'Петров Иван',
    teacherEmail: 'teacher@example.test',
    teacherPhone: '+79990000000',
    organizations: 'Нет',
    motivation: 'Учёба',
    financeInterest: 'Обучение',
    infoSource: 'Сайт',
  }
  for (const [name, value] of Object.entries(values))
    await page.locator(`[name="${name}"]`).fill(value)
  const choices = {
    federalDistrict: 'Центральный федеральный округ',
    region: 'Москва',
    localityType: 'город',
    classCourse: '9',
    isRural: 'no',
    isOrphan: 'no',
    hasDisability: 'no',
  }
  for (const [name, value] of Object.entries(choices))
    await page.locator(`[name="${name}"]`).selectOption(value)
  await page
    .getByRole('button', { name: 'Зарегистрироваться на олимпиаду' })
    .click()
  await expect(page.getByText('Вы зарегистрированы на профиль')).toBeVisible()
  expect(submissions).toHaveLength(1)
  expect(submissions[0]).toMatchObject({
    p_profile_id: eventId,
    p_form: { first_name: 'Иван', is_rural: false },
  })
  await page
    .getByRole('link', { name: 'В личный кабинет', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Мои профили олимпиады' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Статус регистрации' }),
  ).toBeVisible()
})

test('question bank Excel preview blocks invalid points and accepts a valid workbook', async ({
  page,
}) => {
  await mockApi(page, { role: 'admin' })
  await page.goto('/admin/question-banks')
  await page.getByRole('button', { name: '+ Создать набор' }).click()
  const dialog = page.getByRole('dialog')
  const { default: writeWorkbook } = await import('write-excel-file/node')
  const header = [
    '№',
    'Задание',
    'Балл',
    'Тип',
    'Вопрос',
    'Вар.1',
    'Вар.2',
    'Вар.3',
    'Вар.4',
    'Вар.5',
    'Вар.6',
    'Правильный ответ',
  ]
  const preview = async (points) => {
    const buffer = await writeWorkbook(
      [
        header,
        [
          1,
          1,
          points,
          'Один ответ',
          'Что такое бюджет?',
          'План',
          'Письмо',
          null,
          null,
          null,
          null,
          1,
        ],
      ],
      { sheet: 'Вопросы' },
    ).toBuffer()
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'questions.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    })
    await dialog
      .getByRole('button', { name: 'Проверить и открыть предпросмотр' })
      .click()
  }
  const save = dialog.getByRole('button', { name: 'Сохранить набор вопросов' })
  await preview('0,001')
  await expect(
    dialog.getByText(
      'Балл должен быть от 0,01 до 9999,99, до двух знаков после запятой',
    ),
  ).toBeVisible()
  await expect(save).toBeDisabled()
  await preview(1.5)
  await expect(dialog.getByText('Проверка успешно пройдена')).toBeVisible()
  await expect(save).toBeEnabled()
})
