import { Navigate, useParams } from 'react-router'

import { accountPageMock } from '../model/mocks'
import type { AccountSectionKey } from '../model/types'

import { Container } from '@/shared/ui/container/Container'
import { Footer } from '@/widgets/footer/ui/Footer'
import { Header } from '@/widgets/header/ui/Header'
import { AchievementsSection } from '@/widgets/account-achievements/ui/AchievementsSection'
import { AccountEventsSection } from '@/widgets/account-events/ui/AccountEventsSection'
import { AccountProfileBanner } from '@/widgets/account-layout/ui/AccountProfileBanner'
import { AccountSidebar } from '@/widgets/account-layout/ui/AccountSidebar'
import { NotificationsSection } from '@/widgets/account-notifications/ui/NotificationsSection'
import { PersonalDataSection } from '@/widgets/account-personal-data/ui/PersonalDataSection'

import styles from './AccountPage.module.css'

const VALID_SECTIONS: AccountSectionKey[] = [
  'personal',
  'events',
  'achievements',
  'notifications',
]

export function AccountPage() {
  const { section } = useParams()
  const data = accountPageMock

  if (!section || !VALID_SECTIONS.includes(section as AccountSectionKey)) {
    return <Navigate to="/account/personal" replace />
  }

  const activeSection = section as AccountSectionKey

  return (
    <div className={styles.page}>
      <Header navigation={data.siteNavigation} hideAuthButton />

      <main className={styles.main}>
        <Container>
          <div className={styles.workspace}>
            <AccountSidebar items={data.sidebarItems} />

            <div className={styles.content}>
              <AccountProfileBanner profile={data.profile} />

              <div className={styles.sectionArea}>
                {activeSection === 'personal' ? (
                  <PersonalDataSection fields={data.personalFields} />
                ) : null}

                {activeSection === 'events' ? (
                  <AccountEventsSection events={data.events} />
                ) : null}

                {activeSection === 'achievements' ? (
                  <AchievementsSection achievements={data.achievements} />
                ) : null}

                {activeSection === 'notifications' ? (
                  <NotificationsSection items={data.notifications} />
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer
        contacts={data.contacts}
        columns={data.footerColumns}
        socials={data.socials}
      />
    </div>
  )
}