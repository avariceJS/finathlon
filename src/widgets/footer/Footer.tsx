import { Link } from 'react-router'

import type { ContactsSetting } from '@/shared/api'
import { SITE_NAVIGATION } from '@/shared/config/navigation'
import { Container } from '@/shared/ui/container/Container'
import { Logo } from '@/shared/ui/logo/Logo'

import styles from './Footer.module.css'

type FooterProps = {
  contacts: ContactsSetting
}

export function Footer({ contacts }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.brand}>
          <Logo />
          <p className={styles.description}>
            Финатлон — образовательная экосистема для будущих экономистов,
            предпринимателей и финансистов.
          </p>
        </div>

        <div className={styles.column}>
          <h4 className={styles.title}>Разделы</h4>
          {SITE_NAVIGATION.map((item) => (
            <Link key={item.to} to={item.to} className={styles.link}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.column}>
          <h4 className={styles.title}>Полезное</h4>
          <Link to="/documents" className={styles.link}>
            Документы
          </Link>
          <Link to="/account/personal" className={styles.link}>
            Личный кабинет
          </Link>
        </div>

        <div className={styles.column}>
          <h4 className={styles.title}>Контакты</h4>
          <a className={styles.link} href={`tel:${contacts.phone}`}>
            {contacts.phone}
          </a>
          <a className={styles.link} href={`mailto:${contacts.email}`}>
            {contacts.email}
          </a>
          <p className={styles.muted}>{contacts.address}</p>
        </div>
      </Container>

      <Container className={styles.legal}>
        <p>© {year} Финатлон. Все права защищены.</p>
        <p>
          <Link className={styles.link} to="/privacy">
            Политика конфиденциальности
          </Link>
          {' · '}
          <Link className={styles.link} to="/terms">
            Пользовательское соглашение
          </Link>
        </p>
      </Container>
    </footer>
  )
}
