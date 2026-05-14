import type { ReactNode } from 'react'

import { cx } from '@/shared/lib/classNames'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'

import styles from './AdminTable.module.css'

type Column<T> = {
  key: string
  header: string
  render: (item: T) => ReactNode
  width?: string
  align?: 'left' | 'right' | 'center'
}

type AdminTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  rowKey: (item: T) => string
  emptyTitle?: string
  emptyDescription?: string
}

export function AdminTable<T>({
  columns,
  data,
  rowKey,
  emptyTitle = 'Ничего не найдено',
  emptyDescription = 'Создайте первый элемент, и он появится здесь.',
}: AdminTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className={cx(
                  styles.th,
                  column.align && styles[`align-${column.align}`],
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={rowKey(item)} className={styles.row}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    styles.td,
                    column.align && styles[`align-${column.align}`],
                  )}
                >
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
