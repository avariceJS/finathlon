const { test, expect } = require('@playwright/test')

const title = 'Финансовая олимпиада: подготовка, участие и возможности для школьников'
const fixture = {
  news: [{ id: '1', slug: 'test-news', title, summary: 'Материалы для участников.', content: 'Новости олимпиады.', cover_url: '/banner.jpg', author_name: 'Финатлон', published_at: '2026-09-01T00:00:00Z', is_published: true }],
  programs: [{ id: '1', slug: 'test-program', title, summary: 'Участие в олимпиаде.', description: 'Описание.', highlights: ['Для школьников'], cta_label: 'Участвовать', cta_href: '/events', sort_order: 1, is_published: true }],
  partners: [{ id: '1', name: 'Организатор олимпиады', description: 'Поддержка участников.', logo_url: '/logoreg.png', website_url: null, kind: 'partner', sort_order: 1, is_published: true }],
  documents: [{ id: '1', title: 'Положение об олимпиаде', description: 'Правила участия.', category: 'general', file_url: '/banner.jpg', sort_order: 1, is_published: true }],
  stats: [{ id: '1', metric_key: 'participants', value_text: '70 000+', label: 'участников', sort_order: 1, is_published: true }],
  timeline_events: [{ id: '1', title: 'Регистрация участников', date_label: 'Сентябрь', event_year: 2026, accent: 'blue', sort_order: 1, is_published: true }],
  faqs: [{ id: '1', question: 'Как принять участие?', answer: 'Зарегистрируйтесь.', sort_order: 1, is_published: true }],
}

test.beforeEach(async ({ page }) => {
  await page.route('https://example.supabase.co/**', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()
    const rows = fixture[name] || []
    const single = route.request().headers().accept?.includes('application/vnd.pgrst.object')
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(single ? rows[0] || null : rows) })
  })
})

for (const width of [320, 390, 768]) {
  test(`public pages fit ${width}px with content`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 700 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const path of ['/', '/news', '/news/test-news', '/events', '/partners', '/documents', '/privacy', '/terms']) {
      await page.goto(path)
      await expect(page.locator('footer')).toBeVisible()
      if (path === '/' || path === '/news') await expect(page.getByText(title).first()).toBeVisible()
      const brokenImages = await page.locator('img').evaluateAll(images => images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.src))
      expect(brokenImages, path).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(width + 1)
      expect(errors, path).toEqual([])
      if (path === '/' && width === 390) await page.screenshot({ path: testInfo.outputPath('homepage.png'), fullPage: true })
    }
  })
}

test('short screen menu scrolls and its links work', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 240 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Меню' }).click()
  const link = page.getByRole('navigation', { name: 'Мобильная навигация' }).getByRole('link', { name: 'Документы' })
  await link.scrollIntoViewIfNeeded()
  await link.click()
  await expect(page).toHaveURL(/\/documents$/)
})

test('registration form can be filled and closed on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 400 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Войти', exact: true }).first().click()
  await page.getByRole('tab', { name: 'Регистрация' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Имя', { exact: true }).fill('Анна')
  await dialog.getByLabel('Фамилия', { exact: true }).fill('Иванова')
  await dialog.getByLabel('Email', { exact: true }).fill('test@example.com')
  await dialog.getByLabel('Пароль', { exact: true }).fill('123456')
  await dialog.getByLabel('Повторите пароль').fill('123456')
  await expect(dialog.getByRole('button', { name: 'Создать аккаунт' })).toBeVisible()
  expect(await dialog.locator('input').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16)
  await dialog.getByRole('button', { name: 'Закрыть' }).click()
  await expect(dialog).toHaveCount(0)
})
