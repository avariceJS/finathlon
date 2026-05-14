import { Link } from 'react-router'

import styles from './Logo.module.css'

type LogoProps = {
  to?: string
  className?: string
}

export function Logo({ to = '/', className }: LogoProps) {
  return (
    <Link to={to} className={`${styles.logo} ${className ?? ''}`} aria-label="Финатлон">
      <span className={styles.mark}>
        <span className={styles.markRed} />
        <span className={styles.markBlue} />
      </span>
      <span className={styles.text}>Финатлон</span>
    </Link>
  )
}
