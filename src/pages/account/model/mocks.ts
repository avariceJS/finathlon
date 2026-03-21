import type { AccountPageData } from './types'

export const accountPageMock: AccountPageData = {
  siteNavigation: [
    { label: 'Клуб', href: '/' },
    { label: 'Школьники', href: '/' },
    { label: 'Старшеклассники', href: '/' },
    { label: 'Форум', href: '/' },
    { label: 'Документы', href: '/' },
    { label: 'Новости', href: '/' },
    { label: 'Победители', href: '/' },
  ],

  sidebarItems: [
    { key: 'personal', label: 'Личные данные' },
    { key: 'events', label: 'Мои мероприятия' },
    { key: 'achievements', label: 'Достижения' },
    { key: 'notifications', label: 'Уведомления' },
  ],

  profile: {
    fullName: 'Набиев Максим',
    subtitle: '22 года · Московский Политех',
  },

  personalFields: [
    { id: 'school', label: 'Школа', value: 'ГБОУ Школа № 548' },
    { id: 'birthDate', label: 'Дата рождения', value: '2003-04-14', type: 'date' },
    { id: 'email', label: 'Почта', value: 'max.nabiev@mail.ru', type: 'email' },
    { id: 'college', label: 'Колледж', value: 'Колледж при МосПолитехе' },
    { id: 'login', label: 'Логин', value: 'max_nabiev' },
    { id: 'telegram', label: 'Telegram', value: '@nabiev_max' },
    { id: 'university', label: 'ВУЗ', value: 'Московский Политех' },
    { id: 'password', label: 'Пароль', value: '12345678', type: 'password' },
    { id: 'vk', label: 'VK', value: 'vk.com/max_nabiev' },
  ],

  notifications: [
    {
      id: 'n1',
      title: 'Уведомление №1',
      description:
        'Подтверждено участие в мероприятии. Для завершения регистрации откройте документ и ознакомьтесь с условиями участия.',
      documentUrl: '#',
      isRead: false,
    },
    {
      id: 'n2',
      title: 'Уведомление №2',
      description:
        'В личном кабинете доступен новый документ по участию в Финатлон.Форуме. Проверьте сроки и требования к подаче материалов.',
      documentUrl: '#',
      isRead: true,
    },
    {
      id: 'n3',
      title: 'Уведомление №3',
      description:
        'Обновлены данные по результатам предыдущего мероприятия. При необходимости скачайте подтверждающие документы.',
      documentUrl: '#',
      isRead: false,
    },
    {
      id: 'n4',
      title: 'Уведомление №4',
      description:
        'Появилось новое информационное сообщение от организаторов. Рекомендуем прочитать до начала следующего этапа.',
      documentUrl: '#',
      isRead: true,
    },
  ],

  achievements: [
    {
      id: 'a1',
      title: 'Достижение',
      description: 'Описание достижения. Раз два три. Абв. 123',
      progressCurrent: 1,
      progressTotal: 4,
    },
    {
      id: 'a2',
      title: 'Достижение',
      description: 'Описание достижения. Раз два три. Абв. 123',
      progressCurrent: 1,
      progressTotal: 4,
    },
    {
      id: 'a3',
      title: 'Достижение',
      description: 'Описание достижения. Раз два три. Абв. 123',
      progressCurrent: 1,
      progressTotal: 4,
    },
    {
      id: 'a4',
      title: 'Достижение',
      description: 'Описание достижения. Раз два три. Абв. 123',
      progressCurrent: 1,
      progressTotal: 4,
    },
    {
      id: 'a5',
      title: 'Достижение',
      description: 'Описание достижения. Раз два три. Абв. 123',
      progressCurrent: 1,
      progressTotal: 4,
    },
  ],

  events: [
    {
      id: 'e1',
      year: 2025,
      dateLabel: 'фев 2025',
      title: 'Финатлон.Форум',
      result: 'Результат: Лауреат II степени',
      publicationUrl: '#',
      diplomaUrl: '#',
    },
    {
      id: 'e2',
      year: 2025,
      dateLabel: 'ноя 2025',
      title: 'Финатлон.Форум',
      result: 'Результат: Лауреат II степени',
      publicationUrl: '#',
      diplomaUrl: '#',
    },
    {
      id: 'e3',
      year: 2024,
      dateLabel: 'сент 2024',
      title: 'Финатлон.Форум',
      result: 'Результат: Лауреат II степени',
      publicationUrl: '#',
      diplomaUrl: '#',
    },
    {
      id: 'e4',
      year: 2023,
      dateLabel: 'фев 2023',
      title: 'Финатлон.Форум',
      result: 'Результат: Участник',
      diplomaUrl: '#',
    },
    {
      id: 'e5',
      year: 2023,
      dateLabel: 'ноя 2023',
      title: 'Финатлон.Форум',
      result: 'Результат: Лауреат I степени',
      publicationUrl: '#',
      diplomaUrl: '#',
    },
  ],

  contacts: {
    phone: '+7 (999) 999-99-99',
    email: 'finatlon@fin.ru',
    address: '*Адрес, почтовый индекс*',
  },

  footerColumns: [
    {
      id: 'legal',
      links: [
        { label: 'Политика конфиденциальности', href: '#' },
        { label: 'Пользовательское соглашение', href: '#' },
      ],
    },
    {
      id: 'docs',
      links: [
        { label: 'Документация', href: '#' },
        { label: 'Положения', href: '#' },
      ],
    },
    {
      id: 'partners',
      links: [
        { label: 'Партнёры', href: '#' },
        { label: 'Поддержка', href: '#' },
      ],
    },
  ],

  socials: [
    { id: 'vk', label: 'ВКонтакте', href: '#' },
    { id: 'telegram', label: 'Telegram', href: '#' },
  ],
}