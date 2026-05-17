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

export function TermsPage() {
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
        <h1 className={styles.h1}>Пользовательское соглашение</h1>
        <p className={styles.lead}>
          Регистрируясь и используя сайт «Финатлон», вы принимаете правила
          использования сервиса. Ниже — основные положения в упрощённом виде для
          учебного проекта.
        </p>
        <section className={styles.section}>
          <h2>Назначение сервиса</h2>
          <p>
            Платформа предоставляет информацию о мероприятиях, материалах и
            образовательном контенте в области финансовой грамотности.
          </p>
        </section>
        <section className={styles.section}>
          <h2>Учётная запись</h2>
          <p>
            Вы обязуетесь указывать корректные данные при регистрации и не
            передавать доступ к учётной записи третьим лицам. Администрация
            вправе ограничить доступ при нарушении правил или злоупотреблениях.
          </p>
        </section>
        <section className={styles.section}>
          <h2>Контент и интеллектуальная собственность</h2>
          <p>
            Материалы сайта, включая тексты и оформление, используются в рамках
            проекта; копирование для коммерческих целей без согласования не
            допускается.
          </p>
        </section>
        <section className={styles.section}>
          <h2>Изменения</h2>
          <p>
            Условия могут обновляться; актуальная версия публикуется на этой
            странице.
          </p>
        </section>
      </article>
    </PageLayout>
  )
}
