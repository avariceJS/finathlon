import { NavLink, useParams } from 'react-router'

import { AdminLayout } from '@/widgets/admin-layout'

import { DemoBank } from './DemoBank'
import { DemoImport } from './DemoImport'
import { DemoResults } from './DemoResults'
import styles from './AdminDemo.module.css'

const tabs = [
  { to: '/admin/demo-test', label: 'Банк вопросов' },
  { to: '/admin/demo-test/import', label: 'Импорт Excel' },
  { to: '/admin/demo-test/results', label: 'Результаты' },
]

export function AdminDemoPage() {
  const { section } = useParams()
  return (
    <AdminLayout title="Демо-тестирование">
      <nav className={styles.tabs} aria-label="Разделы демо-тестирования">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {section === 'import' ? (
        <DemoImport />
      ) : section === 'results' ? (
        <DemoResults />
      ) : (
        <DemoBank />
      )}
    </AdminLayout>
  )
}
