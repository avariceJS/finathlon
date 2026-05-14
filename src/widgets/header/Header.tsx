import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'

import { AuthModal } from '@/features/AuthModal'
import { useAuth } from '@/shared/auth'
import { SITE_NAVIGATION } from '@/shared/config/navigation'
import { cx } from '@/shared/lib/classNames'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { Logo } from '@/shared/ui/logo/Logo'

import styles from './Header.module.css'

type HeaderProps = {
  variant?: 'public' | 'account' | 'admin'
}

export function Header({ variant = 'public' }: HeaderProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { user, profile, isAdmin, signOut } = useAuth()

  const closeMobile = () => setIsMobileOpen(false)

  const handleAuthClick = () => {
    if (user) {
      navigate('/account/personal')
      closeMobile()
      return
    }
    setIsAuthOpen(true)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    closeMobile()
  }

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    profile?.email ||
    user?.email ||
    'Профиль'

  return (
    <>
      <header className={cx(styles.header, styles[variant])}>
        <Container className={styles.inner}>
          <div className={styles.left}>
            <Logo />
          </div>

          <nav
            className={cx(styles.nav, isMobileOpen && styles.navOpen)}
            aria-label="Основная навигация"
          >
            {SITE_NAVIGATION.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={closeMobile}
                className={({ isActive }) =>
                  cx(styles.navLink, isActive && styles.navLinkActive)
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.right}>
            {user ? (
              <>
                {isAdmin ? (
                  <Button
                    to="/admin"
                    variant="ghost"
                    size="sm"
                    className={styles.hiddenSm}
                  >
                    Админка
                  </Button>
                ) : null}
                <Link
                  to="/account/personal"
                  className={cx(styles.profileChip, styles.hiddenSm)}
                  title={displayName}
                >
                  <span className={styles.profileAvatar}>
                    {initials(profile?.firstName, profile?.lastName, user.email)}
                  </span>
                  <span className={styles.profileName}>{displayName}</span>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                  className={styles.hiddenSm}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleAuthClick}>
                Войти
              </Button>
            )}

            <button
              type="button"
              aria-label="Меню"
              aria-expanded={isMobileOpen}
              className={cx(styles.burger, isMobileOpen && styles.burgerOpen)}
              onClick={() => setIsMobileOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </Container>

        {isMobileOpen ? (
          <div className={styles.mobilePanel}>
            <Container className={styles.mobileInner}>
              <nav className={styles.mobileNav} aria-label="Мобильная навигация">
                {SITE_NAVIGATION.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      cx(
                        styles.mobileLink,
                        isActive && styles.mobileLinkActive,
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className={styles.mobileActions}>
                {user ? (
                  <>
                    <Button to="/account/personal" onClick={closeMobile} fullWidth>
                      Личный кабинет
                    </Button>
                    {isAdmin ? (
                      <Button
                        to="/admin"
                        variant="secondary"
                        onClick={closeMobile}
                        fullWidth
                      >
                        Админ-панель
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      fullWidth
                    >
                      Выйти
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      closeMobile()
                      setIsAuthOpen(true)
                    }}
                    fullWidth
                  >
                    Войти
                  </Button>
                )}
              </div>
            </Container>
          </div>
        ) : null}
      </header>

      {isAuthOpen ? (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      ) : null}
    </>
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
