import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'

import { ADMIN_NAVIGATION } from '@/shared/config/navigation'
import { useAuth } from '@/shared/auth'
import { cx } from '@/shared/lib/classNames'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { Logo } from '@/shared/ui/logo/Logo'

import styles from './AdminLayout.module.css'

type AdminLayoutProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminLayout({
  title,
  description,
  actions,
  children,
}: AdminLayoutProps) {
  const { profile, signOut } = useAuth()
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() ||
    profile?.email ||
    'Администратор'

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo />
          <span className={styles.adminBadge}>Админ-панель</span>
        </div>

        <nav className={styles.nav} aria-label="Навигация по админке">
          {ADMIN_NAVIGATION.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                cx(styles.link, isActive && styles.linkActive)
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.user}>
          <p className={styles.userName}>{fullName}</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              await signOut()
            }}
            fullWidth
          >
            Выйти
          </Button>
          <Link to="/" className={styles.exit}>
            ← Вернуться на сайт
          </Link>
        </div>
      </aside>

      <main className={styles.main}>
        <Container className={styles.head}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </Container>

        <Container className={styles.body}>{children}</Container>
      </main>
    </div>
  )
}
