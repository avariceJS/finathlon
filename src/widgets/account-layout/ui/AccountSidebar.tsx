import { NavLink, useNavigate } from 'react-router'

import type { AccountSidebarItem } from '@/pages/account/model/types'
import { cx } from '@/shared/lib/classNames'

import styles from '../styles/AccountSidebar.module.css'

type AccountSidebarProps = {
  items: AccountSidebarItem[]
}

export function AccountSidebar({ items }: AccountSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label="Навигация личного кабинета">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={`/account/${item.key}`}
            className={({ isActive }) =>
              cx(styles.navItem, isActive && styles.navItemActive)
            }
          >
            <span className={styles.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        className={styles.calendarCard}
        type="button"
        onClick={() => navigate('/account/events')}
      >
        Календарь с отмеченными мероприятиями
      </button>
    </aside>
  )
}