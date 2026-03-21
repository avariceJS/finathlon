import { useState, type ReactNode } from 'react'

import { AuthModal } from '@/features/auth/ui/AuthModal'
import type { NavItem } from '@/pages/home/model/types'
import { cx } from '@/shared/lib/classNames'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { Logo } from '@/shared/ui/logo/Logo'

import styles from './Header.module.css'

type HeaderProps = {
  navigation: NavItem[]
  hideAuthButton?: boolean
  rightSlot?: ReactNode
}

export function Header({
  navigation,
  hideAuthButton = false,
  rightSlot,
}: HeaderProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const showDefaultAuthButton = !hideAuthButton && !rightSlot
  const isCenteredNavLayout = hideAuthButton && !rightSlot

  return (
    <>
      <header className={styles.header}>
        <Container
          className={cx(styles.inner, isCenteredNavLayout && styles.innerNoAction)}
        >
          <Logo />

          <nav
            className={cx(styles.nav, isCenteredNavLayout && styles.navCentered)}
            aria-label="Основная навигация"
          >
            {navigation.map((item) => (
              <a key={item.label} className={styles.navLink} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          {rightSlot}

          {showDefaultAuthButton ? (
            <Button size="sm" onClick={() => setIsAuthModalOpen(true)}>
              Личный кабинет
            </Button>
          ) : null}
        </Container>
      </header>

      {showDefaultAuthButton && isAuthModalOpen ? (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      ) : null}
    </>
  )
}