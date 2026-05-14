import { Link } from 'react-router'

import type { Profile } from '@/entities/profile'
import { age } from '@/shared/lib/format'

import styles from './AccountBanner.module.css'

type AccountBannerProps = {
  profile: Profile | null
  email: string | null
}

export function AccountBanner({ profile, email }: AccountBannerProps) {
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() ||
    profile?.email ||
    email ||
    'Профиль'

  const profileAge = age(profile?.birthDate)
  const role = profile?.role === 'admin' ? 'Администратор' : 'Участник'

  const meta = [
    profileAge !== null ? `${profileAge} ${getYearWord(profileAge)}` : null,
    profile?.school || null,
    profile?.city || null,
  ].filter(Boolean) as string[]

  return (
    <section className={styles.banner}>
      <div className={styles.avatar}>
        {initials(profile?.firstName, profile?.lastName, email)}
      </div>
      <div className={styles.text}>
        <p className={styles.role}>{role}</p>
        <h1 className={styles.name}>{fullName}</h1>
        <p className={styles.meta}>
          {meta.length ? meta.join(' · ') : 'Заполните профиль, чтобы продолжить'}
        </p>
      </div>
      {!profile?.isComplete ? (
        <Link to="/account/personal" className={styles.cta}>
          Заполнить профиль →
        </Link>
      ) : null}
    </section>
  )
}

function initials(
  first?: string | null,
  last?: string | null,
  email?: string | null,
): string {
  const f = first?.[0] ?? ''
  const l = last?.[0] ?? ''
  const combined = (f + l).trim()
  if (combined) return combined.toUpperCase()
  if (email) return email[0]?.toUpperCase() ?? '?'
  return '?'
}

function getYearWord(value: number) {
  const last = Math.abs(value) % 10
  const lastTwo = Math.abs(value) % 100
  if (lastTwo >= 11 && lastTwo <= 14) return 'лет'
  if (last === 1) return 'год'
  if (last >= 2 && last <= 4) return 'года'
  return 'лет'
}
