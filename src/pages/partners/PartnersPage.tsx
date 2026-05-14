import { useEffect, useState } from 'react'

import type { CouncilMember } from '@/entities/council'
import type { Partner } from '@/entities/partner'
import {
  councilApi,
  partnersApi,
  siteSettingsApi,
  type ContactsSetting,
} from '@/shared/api'
import { DEFAULT_CONTACTS_SETTING } from '@/shared/api/site-settings'
import { Alert } from '@/shared/ui/alert/Alert'
import { Container } from '@/shared/ui/container/Container'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { Section } from '@/shared/ui/section/Section'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'

import styles from './PartnersPage.module.css'

export function PartnersPage() {
  const [organizers, setOrganizers] = useState<Partner[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [council, setCouncil] = useState<CouncilMember[]>([])
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      partnersApi.listPartners({ kind: 'organizer' }),
      partnersApi.listPartners({ kind: 'partner' }),
      councilApi.listCouncil(),
      siteSettingsApi.fetchSiteSettings(),
    ])
      .then(([organizersRes, partnersRes, councilRes, settingsRes]) => {
        if (cancelled) return
        setOrganizers(organizersRes.data ?? [])
        setPartners(partnersRes.data ?? [])
        setCouncil(councilRes.data ?? [])
        if (settingsRes.data) setContacts(settingsRes.data.contacts)
        setError(
          organizersRes.error ??
            partnersRes.error ??
            councilRes.error ??
            settingsRes.error,
        )
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageLayout header={<Header />} footer={<Footer contacts={contacts} />}>
      <PageHeader
        eyebrow="Партнёры"
        title="Организаторы, партнёры и совет"
        description="Финатлон поддерживают ведущие вузы, банки и медиа. Совет проекта — эксперты с международным опытом."
      />

      <Container>
        {error ? (
          <Alert variant="error" title="Ошибка загрузки">
            {error}
          </Alert>
        ) : null}
      </Container>

      {isLoading ? (
        <Container>
          <Spinner label="Загружаем партнёров..." />
        </Container>
      ) : (
        <>
          <Section
            title="Организаторы"
            description="Команды, обеспечивающие подготовку и проведение мероприятий."
          >
            {organizers.length === 0 ? (
              <EmptyState title="Список организаторов пока пуст" />
            ) : (
              <div className={styles.partnersGrid}>
                {organizers.map((item) => (
                  <PartnerCard key={item.id} partner={item} />
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Партнёры"
            description="Компании и организации, поддерживающие проект."
          >
            {partners.length === 0 ? (
              <EmptyState title="Список партнёров пока пуст" />
            ) : (
              <div className={styles.partnersGrid}>
                {partners.map((item) => (
                  <PartnerCard key={item.id} partner={item} />
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Попечительский совет"
            description="Эксперты, формирующие методическую и научную основу проекта."
          >
            {council.length === 0 ? (
              <EmptyState title="Информация о совете появится позже" />
            ) : (
              <div className={styles.councilGrid}>
                {council.map((member) => (
                  <article key={member.id} className={styles.councilCard}>
                    <div className={styles.photo}>
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt={member.fullName} />
                      ) : (
                        <span>{initials(member.fullName)}</span>
                      )}
                    </div>
                    <h3 className={styles.councilName}>{member.fullName}</h3>
                    {member.title ? (
                      <p className={styles.councilTitle}>{member.title}</p>
                    ) : null}
                    {member.bio ? (
                      <p className={styles.councilBio}>{member.bio}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </PageLayout>
  )
}

function PartnerCard({ partner }: { partner: Partner }) {
  const card = (
    <article className={styles.partnerCard}>
      <div className={styles.partnerLogo}>
        {partner.logoUrl ? (
          <img src={partner.logoUrl} alt={partner.name} />
        ) : (
          <span>{initials(partner.name)}</span>
        )}
      </div>
      <h3 className={styles.partnerName}>{partner.name}</h3>
      {partner.description ? (
        <p className={styles.partnerDescription}>{partner.description}</p>
      ) : null}
    </article>
  )

  if (partner.websiteUrl) {
    return (
      <a
        href={partner.websiteUrl}
        target="_blank"
        rel="noreferrer"
        className={styles.partnerLink}
      >
        {card}
      </a>
    )
  }
  return card
}

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
