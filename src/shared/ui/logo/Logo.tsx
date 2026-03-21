import styles from './Logo.module.css'

export function Logo() {
  return (
    <a className={styles.logo} href="/" aria-label="Финатлон">
      <span className={styles.mark}>
        <span className={styles.markRed} />
        <span className={styles.markGray} />
      </span>

      <span className={styles.text}>ФИНАТЛОН</span>
    </a>
  )
}