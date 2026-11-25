import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import { documentSectionsApi, type DocumentSection } from '@/shared/api'
import { cx } from '@/shared/lib/classNames'
import styles from './Header.module.css'

type HeaderDropdownProps = {
  onNavigate: () => void
}

export function HeaderDropdown({ onNavigate }: HeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sections, setSections] = useState<DocumentSection[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    documentSectionsApi.listDocumentSections().then((res) => {
      if (res.data) setSections(res.data)
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Рекурсивная функция для вывода разделов
  const renderSections = (parentId: string | null, level = 1) => {
    if (level > 3) return null // Ограничение по ТЗ

    const children = sections.filter((s) => s.parentId === parentId)
    if (children.length === 0) return null

    return (
      <div className={level === 1 ? styles.dropdownMenu : styles.dropdownGroupChildren}>
        {children.map((section) => {
          // Выбираем класс в зависимости от уровня
          let linkClass = styles.dropdownItem
          if (level === 2) linkClass = styles.dropdownChildItem
          if (level === 3) linkClass = styles.dropdownLevel3

          return (
            <div key={section.id}>
              <NavLink
                to={`/documents#${section.slug}`}
                className={linkClass}
                onClick={() => {
                  setIsOpen(false)
                  onNavigate()
                }}
              >
                {section.title}
              </NavLink>
              {renderSections(section.id, level + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        type="button"
        className={cx(styles.navLink, isOpen && styles.navLinkActive)}
        onClick={() => setIsOpen(!isOpen)}
      >
        Документы
        <span style={{ fontSize: '10px', marginLeft: '4px' }}>▼</span>
      </button>

      {isOpen && renderSections(null, 1)}
    </div>
  )
}