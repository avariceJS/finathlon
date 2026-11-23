const { test, expect } = require('@playwright/test')
const { default: readWorkbook } = require('read-excel-file/node')
const { default: writeWorkbook } = require('write-excel-file/node')

const publicPath = '/demo-test?profile=informatics&grades=10-11'
const adminPath = '/admin/demo-test'
const adminId = '33333333-3333-4333-8333-333333333333'
const title = 'Сопоставьте ситуации и подходящие действия.'
const explanation =
  'Сначала сравните условия и только затем принимайте решение.'
const category = { profile: 'finance', grades: '6-7' }
const longText =
  'Длинный текст варианта, который должен переноситься на следующую строку на телефоне. '
    .repeat(3)
    .trim()

async function fit(page, width) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width + 1)
  const overflow = await page
    .locator('main input, main select, main button, main textarea')
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const bounds = element.getBoundingClientRect()
          if (!bounds.width || !bounds.height) return false
          return (
            bounds.left < -1 ||
            bounds.right > document.documentElement.clientWidth + 1
          )
        })
        .map(
          (element) =>
            element.getAttribute('aria-label') ?? element.textContent,
        ),
    )
  expect(overflow).toEqual([])
}

async function screenshot(locator, testInfo, name) {
  await locator.screenshot({
    path: testInfo.outputPath(name),
    animations: 'disabled',
  })
}

for (const width of [320, 390, 768, 1440]) {
  test(`demo entry fits ${width}px and opens the selected independent category`, async ({
    page,
  }, testInfo) => {
    await page.route('https://example.supabase.co/**', (route) =>
      route.fulfill({ json: [] }),
    )
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Демо-тестирование' })
    await expect(section.getByLabel('Профиль').locator('option')).toHaveCount(2)
    await expect(section.getByLabel('Классы').locator('option')).toHaveCount(3)
    await fit(page, width)
    if (width === 390 || width === 1440)
      await screenshot(section, testInfo, 'demo-home.png')
    await section.getByLabel('Профиль').selectOption('informatics')
    await section.getByLabel('Классы').selectOption('10-11')
    await section.getByRole('button', { name: 'Начать демо-тест' }).click()
    await expect(page).toHaveURL(publicPath)
    await expect(
      page.getByRole('heading', { name: 'Демо-тестирование' }),
    ).toBeVisible()
    await fit(page, width)
  })
}

const questions = Array.from({ length: 30 }, (_, index) => ({
  number: index + 1,
  points: 1,
  counterparts: [],
  prompt: `Текст вопроса ${index + 1}`,
  kind: 'single',
  options: ['Вариант А', 'Вариант Б'],
  ...([
    { options: [longText, 'Другой вариант'] },
    { kind: 'multiple', options: ['Первый', 'Второй', 'Третий'] },
    {
      kind: 'matching',
      prompt: title,
      options: ['Ситуация А', 'Ситуация Б'],
      counterparts: [longText, 'Подходящее действие'],
    },
    { kind: 'short', options: [] },
    { kind: 'sequence', options: [longText, 'Завершающий шаг'] },
  ][index] ?? {}),
}))

for (const width of [320, 1440]) {
  test(`all five question types, feedback and retry work at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000)
    const starts = []
    const submissions = []
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: 850 })
    await page.route('https://example.supabase.co/**', (route) => {
      const name = new URL(route.request().url()).pathname.split('/').at(-1)
      if (name === 'demo_start') {
        starts.push(route.request().postDataJSON())
        return route.fulfill({
          json: { id: `attempt-${starts.length}`, questions },
        })
      }
      if (name === 'demo_finish') {
        submissions.push(route.request().postDataJSON())
        if (submissions.length === 1) {
          return route.fulfill({
            status: 503,
            json: {
              code: 'unavailable',
              message: 'Попробуйте отправить ответ ещё раз.',
            },
          })
        }
        return route.fulfill({
          json: {
            correctCount: 29,
            questionCount: 30,
            score: 29,
            maxScore: 30,
            mistakes: [
              {
                ...questions[2],
                solutions: ['2', '1'],
                answer: ['1', '2'],
                explanation,
              },
            ],
          },
        })
      }
      return route.fulfill({ json: [] })
    })
    await page.goto(publicPath)
    const start = page.getByRole('button', {
      name: 'Начать тест',
      exact: true,
    })
    await expect(start).toBeDisabled()
    await page.getByLabel('Регион').fill('Московская область')
    await page.getByLabel('Город').fill('Химки')
    await start.click()
    await expect(page.getByText('Вопрос 1 из 30')).toBeVisible()
    expect(starts[0]).toEqual({
      p_profile: 'informatics',
      p_grades: '10-11',
      p_region: 'Московская область',
      p_city: 'Химки',
    })
    const next = page.getByRole('button', { name: 'Далее' })
    await expect(next).toBeDisabled()
    await page.getByRole('radio').first().check()
    await next.click()
    await page.getByRole('checkbox', { name: 'Первый' }).check()
    await page.getByRole('checkbox', { name: 'Третий' }).check()
    await next.click()
    await expect(page.getByText('Вопрос 3 из 30')).toBeVisible()
    const progress = page.getByRole('progressbar')
    await expect(progress).toHaveAttribute('value', '2')
    await page.getByLabel('Ситуация А').selectOption('1')
    await page.getByLabel('Ситуация Б').selectOption('1')
    await expect(next).toBeDisabled()
    await page.getByLabel('Ситуация А').selectOption('2')
    await page.getByLabel('Ситуация Б').selectOption('1')
    await page.getByLabel('Ситуация А').selectOption('1')
    await page.getByLabel('Ситуация Б').selectOption('2')
    await fit(page, width)
    await screenshot(
      page.getByRole('region', { name: title }),
      testInfo,
      'demo-question.png',
    )
    await next.click()
    await page.getByLabel('Ваш ответ').fill('1,5')
    await next.click()
    await page.getByLabel('Позиция 1').selectOption('2')
    await page.getByLabel('Позиция 2').selectOption('1')
    await next.click()
    for (let number = 6; number <= 30; number++) {
      await expect(page.getByText(`Вопрос ${number} из 30`)).toBeVisible()
      await page.getByRole('radio').first().check()
      if (number < 30) await next.click()
    }
    await expect(
      page.getByRole('heading', { name: 'Результат теста' }),
    ).toHaveCount(0)
    const finish = page.getByRole('button', { name: 'Завершить тест' })
    await finish.click()
    await expect(page.getByRole('alert')).toContainText(
      'Попробуйте отправить ответ ещё раз.',
    )
    await finish.click()
    await expect(
      page.getByRole('heading', { name: 'Результат теста' }),
    ).toBeVisible()
    expect(submissions[0]).toEqual(submissions[1])
    expect(submissions[1].p_answers).toHaveLength(30)
    expect(submissions[1].p_answers.slice(0, 5)).toEqual([
      ['1'],
      ['1', '3'],
      ['1', '2'],
      ['1,5'],
      ['2', '1'],
    ])
    await expect(page.getByText(explanation)).toBeVisible()
    await expect(
      page.getByText('Правильный ответ', { exact: true }),
    ).toBeVisible()
    await fit(page, width)
    await screenshot(
      page.getByRole('region', { name: 'Результат теста' }),
      testInfo,
      'demo-result.png',
    )
    await page.getByRole('button', { name: 'Пройти тест ещё раз' }).click()
    await expect(page.getByText('Вопрос 1 из 30')).toBeVisible()
    expect(starts).toHaveLength(2)
    expect(errors).toEqual([])
  })
}

const attempt = {
  ...category,
  id: '44444444-4444-4444-8444-444444444444',
  completed_at: '2026-11-20T12:36:00Z',
  region: 'Московская область',
  city: 'Химки',
  correct_count: 25,
  question_count: 30,
  score: 28,
  max_score: 33,
  incorrect_numbers: [1, 4, 6, 15, 30],
}

async function mockAdmin(page) {
  await page.addInitScript(
    ({ id }) => {
      const expiry = Math.floor(Date.now() / 1000) + 3600
      const token = `${btoa('{"alg":"HS256","typ":"JWT"}')}.${btoa(JSON.stringify({ sub: id, exp: expiry, role: 'authenticated' }))}.test`
      localStorage.setItem(
        'sb-example-auth-token',
        JSON.stringify({
          access_token: token,
          refresh_token: 'test',
          token_type: 'bearer',
          expires_at: expiry,
          expires_in: 3600,
          user: { id, email: 'admin@example.test', aud: 'authenticated' },
        }),
      )
    },
    { id: adminId },
  )
  const profile = {
    id: adminId,
    role: 'admin',
    email: 'admin@example.test',
    first_name: 'Администратор',
  }
  const state = { questions: [], reports: [], filters: [] }
  await page.route('https://example.supabase.co/**', (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const endpoint = url.pathname.split('/').at(-1)
    switch (endpoint) {
      case 'user':
        return route.fulfill({ json: profile })
      case 'profiles':
        return route.fulfill({ json: profile })
      case 'demo_import': {
        const body = request.postDataJSON()
        state.questions = body.p_questions
        state.reports = body.p_reports
        return route.fulfill({ status: 204 })
      }
      case 'demo_questions': {
        if (request.method() !== 'PATCH')
          return route.fulfill({ json: state.questions })
        const number = Number(url.searchParams.get('number').slice(3))
        const question = state.questions.find(
          (row) =>
            row.number === number &&
            row.profile === 'finance' &&
            row.grades === '6-7',
        )
        question.body = request.postDataJSON().body
        return route.fulfill({ json: question })
      }
      case 'demo_import_reports':
        return route.fulfill({ json: state.reports })
      case 'demo_attempts':
        state.filters.push(url.searchParams)
        return route.fulfill({
          json: [attempt],
          headers: {
            'content-range': '0-0/1',
            'access-control-expose-headers': 'content-range',
          },
        })
      default:
        return route.fulfill({ json: [] })
    }
  })
  return state
}

for (const width of [390, 1440]) {
  test(`admin validates and imports the Excel bank, edits a question and exports filtered results at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000)
    const state = await mockAdmin(page)
    await page.setViewportSize({ width, height: width === 1440 ? 720 : 850 })
    await page.goto(`${adminPath}/import`)
    if (width === 1440) {
      const lastLink = page.getByRole('link', { name: '← Вернуться на сайт' })
      await lastLink.scrollIntoViewIfNeeded()
      await expect(lastLink).toBeInViewport()
    }
    const header = [
      '№',
      'Тип (авто)',
      'Вопрос',
      'Вар.1',
      'Вар.2',
      'Вар.3',
      'Вар.4',
      'Вар.5',
      'Вар.6',
      'Правильный ответ',
      'Статус (авто)',
      'Готово (ОК)',
      'Пояснение',
      'Баллы',
    ]
    const buffer = await writeWorkbook(
      [
        ['Профиль: Финансовый · Классы: 6-7'],
        header,
        [
          1,
          null,
          longText,
          'Вариант А',
          null,
          'Вариант В',
          null,
          null,
          null,
          3,
          null,
          null,
          explanation,
          2,
        ],
        [
          2,
          'Один ответ',
          'Вопрос без пояснения',
          'Ответ А',
          'Ответ Б',
          null,
          null,
          null,
          null,
          2,
        ],
      ],
      { sheet: 'Фин_6-7' },
    ).toBuffer()
    const file = page.getByLabel('Файл Excel')
    await file.setInputFiles({
      name: 'тестовый банк.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    })
    await page.getByRole('button', { name: 'Проверить' }).click()
    await expect(
      page.getByRole('heading', { name: 'Результат проверки' }),
    ).toBeVisible()
    await expect(
      page.getByText('Финансовая грамотность · 6–7 классы — 1 из 2'),
    ).toBeVisible()
    await page.getByText('Ошибки в файле и строках (1)').click()
    await expect(page.getByText('Фин_6-7 · строка 4')).toBeVisible()
    await expect(
      page.getByText('Пояснение должно содержать от 1 до 10 000 символов.'),
    ).toBeVisible()
    await fit(page, width)
    await screenshot(
      page.getByRole('region', { name: 'Импорт банка вопросов' }),
      testInfo,
      'demo-import.png',
    )
    await page.getByRole('button', { name: 'Подтвердить импорт' }).click()
    await expect(
      page.getByRole('heading', { name: 'Результат импорта' }),
    ).toBeVisible()
    expect(state.questions[0].body).toMatchObject({
      options: ['Вариант А', 'Вариант В'],
      solutions: ['2'],
      points: 2,
    })

    if (process.env.DEMO_WORKBOOK_PATH) {
      await file.setInputFiles(process.env.DEMO_WORKBOOK_PATH)
      await page.getByRole('button', { name: 'Проверить' }).click()
      await expect(
        page.getByText('Финансовая грамотность · 6–7 классы — 30 из 30'),
      ).toBeVisible()
      await expect(
        page.getByText('Финансовая грамотность · 10–11 классы — 29 из 30'),
      ).toBeVisible()
      await expect(
        page.getByText('Информатика · 10–11 классы — 30 из 30'),
      ).toBeVisible()
      await page.getByText('Ошибки в файле и строках (1)').click()
      await expect(page.getByText('Фин_10-11 · строка 21')).toBeVisible()
    }

    if (process.env.DEMO_CORRECTED_WORKBOOK_PATH) {
      await file.setInputFiles(process.env.DEMO_CORRECTED_WORKBOOK_PATH)
      await page.getByRole('button', { name: 'Проверить' }).click()
      await expect(
        page.getByText('Финансовая грамотность · 10–11 классы — 30 из 30'),
      ).toBeVisible()
      await expect(
        page.getByText('Ошибки в файле и строках', { exact: false }),
      ).toHaveCount(0)
      await page.getByRole('button', { name: 'Подтвердить импорт' }).click()
      await expect(
        page.getByRole('heading', { name: 'Результат импорта' }),
      ).toBeVisible()
      expect(state.questions).toHaveLength(180)
      expect(
        new Set(state.questions.map((question) => question.body.kind)).size,
      ).toBe(5)
      expect(state.reports).toHaveLength(6)
    }

    await page.getByRole('link', { name: 'Открыть банк вопросов' }).click()
    await page
      .getByRole('button', { name: 'Редактировать вопрос №1', exact: true })
      .click()
    const editor = page.getByRole('form', {
      name: 'Редактирование вопроса №1',
    })
    await editor.getByLabel('Текст вопроса').fill('Обновлённый текст вопроса')
    await editor.getByLabel('Баллы').fill('3')
    await fit(page, width)
    await editor.getByRole('button', { name: 'Сохранить вопрос' }).click()
    await expect(page.getByText('Вопрос №1 сохранён.')).toBeVisible()
    expect(state.questions[0].body).toMatchObject({
      points: 3,
      prompt: 'Обновлённый текст вопроса',
    })
    if (!process.env.DEMO_CORRECTED_WORKBOOK_PATH)
      await expect(
        page.getByText('Строка импорта требует проверки'),
      ).toBeVisible()

    await page.getByRole('link', { name: 'Результаты', exact: true }).click()
    const form = page.getByRole('form', { name: 'Фильтры результатов' })
    await form.getByLabel('Профиль').selectOption('finance')
    await form.getByLabel('Классы').selectOption('6-7')
    await form.getByLabel('Регион').fill('Московская')
    await form.getByLabel('С даты (МСК)').fill('2026-11-20')
    await form.getByLabel('По дату (МСК)').fill('2026-11-20')
    await form.getByRole('button', { name: 'Применить фильтры' }).click()
    await expect(page.getByText('Найдено попыток: 1')).toBeVisible()
    await fit(page, width)
    await screenshot(
      page.getByRole('region', { name: 'Результаты' }),
      testInfo,
      'demo-admin-results.png',
    )
    const downloadPromise = page.waitForEvent('download')
    await form.getByRole('button', { name: 'Выгрузить в Excel' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('demo-test-results.xlsx')
    const [{ data }] = await readWorkbook(await download.path())
    expect(data[1]).toEqual([
      '20.11.2026, 15:36',
      'Финансовая грамотность',
      '6–7 классы',
      'Московская область',
      'Химки',
      25,
      30,
      28,
      33,
      '1, 4, 6, 15, 30',
    ])
    for (const query of state.filters.slice(-2)) {
      expect(query.get('profile')).toBe('eq.finance')
      expect(query.get('grades')).toBe('eq.6-7')
      expect(query.get('region')).toBe('ilike.%Московская%')
      expect(query.getAll('completed_at')).toEqual([
        'not.is.null',
        'gte.2026-11-20T00:00:00+03:00',
        'lte.2026-11-20T23:59:59.999999+03:00',
      ])
    }
  })
}
