import type { AccountProfile } from '@/pages/account/model/types'

import styles from '../styles/AccountProfileBanner.module.css'

type AccountProfileBannerProps = {
  profile: AccountProfile
}

export function AccountProfileBanner({
  profile,
}: AccountProfileBannerProps) {
  return (
    <section className={styles.banner}>
      <div className={styles.avatar} />

      <h1 className={styles.name}>{profile.fullName}</h1>
      <p className={styles.subtitle}>{profile.subtitle}</p>
    </section>
  )
}