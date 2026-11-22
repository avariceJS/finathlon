export type NavLink = {
  label: string
  to: string
}

export const SITE_NAVIGATION: NavLink[] = [
  { label: 'Главная', to: '/' },
  { label: 'Новости', to: '/news' },
  { label: 'Мероприятия', to: '/events' },
  { label: 'Партнёры', to: '/partners' },
  { label: 'Документы', to: '/documents' },
]

export const ACCOUNT_NAVIGATION = [
  { label: 'Личные данные', to: '/account/personal', key: 'personal' as const },
  { label: 'Мои мероприятия', to: '/account/events', key: 'events' as const },
  { label: 'Достижения', to: '/account/achievements', key: 'achievements' as const },
  { label: 'Уведомления', to: '/account/notifications', key: 'notifications' as const },
]

export type AccountSectionKey = (typeof ACCOUNT_NAVIGATION)[number]['key']

export const ADMIN_NAVIGATION = [
  { label: 'Главная', to: '/admin' },
  { label: 'Новости', to: '/admin/news' },
  { label: 'Программы', to: '/admin/programs' },
  { label: 'Партнёры', to: '/admin/partners' },
  { label: 'Совет', to: '/admin/council' },
  { label: 'Документы', to: '/admin/documents' },
  { label: 'FAQ', to: '/admin/faqs' },
  { label: 'Таймлайн', to: '/admin/timeline' },
  { label: 'Статистика', to: '/admin/stats' },
  { label: 'Демо-тестирование', to: '/admin/demo-test' },
  { label: 'Уведомления', to: '/admin/notifications' },
  { label: 'Пользователи', to: '/admin/users' },
  { label: 'Олимпиады и профили', to: '/admin/olympiads' },
  { label: 'Профили олимпиад', to: '/admin/olympiad-profiles' },
  { label: 'Набор вопросов', to: '/admin/question-banks' },
  { label: 'Контент сайта', to: '/admin/settings' },
]
