import { NavLink } from 'react-router'

import { ACCOUNT_NAVIGATION } from '@/shared/config/navigation'
import { cx } from '@/shared/lib/classNames'

import styles from './AccountSidebar.module.css'

type AccountSidebarProps = {
  notificationsUnread?: number
}

const ICONS: Record<string, string> = {
  personal: '👤',
  events: '📅',
  achievements: '🏆',
  notifications: '🔔',
}

export function AccountSidebar({ notificationsUnread }: AccountSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label="Навигация личного кабинета">
        {ACCOUNT_NAVIGATION.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cx(styles.link, isActive && styles.linkActive)
            }
          >
            <span className={styles.icon} aria-hidden="true">
              {ICONS[item.key] ?? '•'}
            </span>
            <span className={styles.label}>{item.label}</span>
            {item.key === 'notifications' &&
            notificationsUnread &&
            notificationsUnread > 0 ? (
              <span className={styles.badge}>{notificationsUnread}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
