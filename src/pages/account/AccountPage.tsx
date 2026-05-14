import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'

import { siteSettingsApi, type ContactsSetting } from '@/shared/api'
import { DEFAULT_CONTACTS_SETTING } from '@/shared/api/site-settings'
import { useAuth } from '@/shared/auth'
import type { AccountSectionKey } from '@/shared/config/navigation'
import { Alert } from '@/shared/ui/alert/Alert'
import { Container } from '@/shared/ui/container/Container'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { AccountBanner } from '@/widgets/account-banner'
import { AchievementsSection } from '@/widgets/account-achievements'
import { EventsSection } from '@/widgets/account-events'
import { NotificationsSection } from '@/widgets/account-notifications'
import { PersonalDataSection } from '@/widgets/account-personal'
import { AccountSidebar } from '@/widgets/account-sidebar'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'

import { useAccountData } from './useAccountData'
import styles from './AccountPage.module.css'

const VALID_SECTIONS: AccountSectionKey[] = [
  'personal',
  'events',
  'achievements',
  'notifications',
]

export function AccountPage() {
  const { section } = useParams()
  const { user, profile, isProfileLoading } = useAuth()
  const { data, isLoading: isDataLoading, error, reload } = useAccountData()
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )

  useEffect(() => {
    let cancelled = false
    siteSettingsApi.fetchSiteSettings().then((res) => {
      if (cancelled || !res.data) return
      setContacts(res.data.contacts)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!section || !VALID_SECTIONS.includes(section as AccountSectionKey)) {
    return <Navigate to="/account/personal" replace />
  }
  const activeSection = section as AccountSectionKey

  const unreadCount = data.notifications.filter((n) => !n.isRead).length

  return (
    <PageLayout
      header={<Header variant="account" />}
      footer={<Footer contacts={contacts} />}
    >
      <Container>
        <div className={styles.workspace}>
          <AccountSidebar notificationsUnread={unreadCount} />

          <div className={styles.content}>
            <AccountBanner profile={profile} email={user?.email ?? null} />

            {error ? (
              <Alert variant="error" title="Ошибка загрузки">
                {error}
              </Alert>
            ) : null}

            <div className={styles.body}>
              {isProfileLoading || isDataLoading ? (
                <Spinner label="Загружаем профиль..." />
              ) : (
                <>
                  {activeSection === 'personal' ? (
                    <PersonalDataSection
                      profile={profile}
                      email={user?.email ?? null}
                    />
                  ) : null}
                  {activeSection === 'events' ? (
                    <EventsSection events={data.events} />
                  ) : null}
                  {activeSection === 'achievements' ? (
                    <AchievementsSection achievements={data.achievements} />
                  ) : null}
                  {activeSection === 'notifications' ? (
                    <NotificationsSection
                      notifications={data.notifications}
                      onChange={reload}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </PageLayout>
  )
}
