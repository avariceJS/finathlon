import type { NavItem } from '@/pages/home/model/types'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { Logo } from '@/shared/ui/logo/Logo'

import styles from './Header.module.css'

type HeaderProps = {
  navigation: NavItem[]
}

export function Header({ navigation }: HeaderProps) {
  return (
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

        <Button href="#" size="sm">
          Личный кабинет
        </Button>
      </Container>
    </header>
  )
}