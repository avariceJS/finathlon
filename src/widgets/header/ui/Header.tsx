import { useState } from 'react'

import { AuthModal } from '@/features/auth/ui/AuthModal'
import type { NavItem } from '@/pages/home/model/types'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { Logo } from '@/shared/ui/logo/Logo'

import styles from './Header.module.css'

type HeaderProps = {
  navigation: NavItem[]
}

export function Header({ navigation }: HeaderProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <>
      <header className={styles.header}>
        <Container className={styles.inner}>
          <Logo />

          <nav className={styles.nav} aria-label="Основная навигация">
            {navigation.map((item) => (
              <a key={item.label} className={styles.navLink} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <Button size="sm" onClick={() => setIsAuthModalOpen(true)}>
            Личный кабинет
          </Button>
        </Container>
      </header>

      {isAuthModalOpen ? (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      ) : null}
    </>
  )
}