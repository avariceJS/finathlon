import { useEffect, useState } from 'react'

import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'
import {
  DEFAULT_CONTACTS_SETTING,
  siteSettingsApi,
  type ContactsSetting,
} from '@/shared/api'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'

import styles from './legal-page.module.css'

export function PrivacyPage() {
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )

  useEffect(() => {
    void siteSettingsApi.fetchSiteSettings().then((res) => {
      if (res.data) setContacts(res.data.contacts)
    })
  }, [])

  return (
    <PageLayout
      header={<Header />}
      footer={<Footer contacts={contacts} />}
      withContainer
    >
      <article className={styles.article}>
        <h1 className={styles.h1}>Политика конфиденциальности</h1>
        <p className={styles.lead}>
          Настоящая политика описывает базовые принципы обработки персональных
          данных в рамках сервиса «Финатлон». Текст предназначен для учебной
          демонстрации; для юридически значимого документа его нужно согласовать
          с образовательной организацией.
        </p>
        <section className={styles.section}>
          <h2>Какие данные обрабатываются</h2>
          <p>
            При регистрации и использовании личного кабинета могут
            обрабатываться: адрес электронной почты, имя и фамилия, контактные
            данные и сведения профиля, которые вы указываете добровольно.
            Технические данные (идентификатор сессии) обрабатываются провайдером
            аутентификации (Supabase).
          </p>
        </section>
        <section className={styles.section}>
          <h2>Цели обработки</h2>
          <p>
            Данные используются для предоставления доступа к материалам
            платформы, участия в мероприятиях и связи по вопросам сервиса. Мы не
            продаём персональные данные третьим лицам.
          </p>
        </section>
        <section className={styles.section}>
          <h2>Обращения</h2>
          <p>
            По вопросам персональных данных вы можете связаться с организаторами
            через контакты в подвале сайта.
          </p>
        </section>
      </article>
    </PageLayout>
  )
}
