import type { DemoImportIssue } from '@/entities/demo-test/model'

import styles from './AdminDemo.module.css'

export function DemoIssues({ issues }: { issues: DemoImportIssue[] }) {
  if (!issues.length) return null
  return (
    <details className={styles.issues}>
      <summary>Ошибки в файле и строках ({issues.length})</summary>
      <ul>
        {issues.map(({ sheet, row, messages }, index) => (
          <li key={index}>
            <strong>
              {sheet}
              {row === null ? '' : ` · строка ${row}`}
            </strong>
            <p>{messages.join(' ')}</p>
          </li>
        ))}
      </ul>
    </details>
  )
}
