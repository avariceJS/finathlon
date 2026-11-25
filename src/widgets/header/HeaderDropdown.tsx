import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'

import { documentSectionsApi, type DocumentSection } from '@/shared/api'
import { cx } from '@/shared/lib/classNames'

import styles from './Header.module.css'

function SectionLinks({ onNavigate }: { onNavigate: () => void }) {
  const [sections, setSections] = useState<DocumentSection[] | null>(null)

  useEffect(() => {
    let cancelled = false
    documentSectionsApi
      .listDocumentSections()
      .then((result) => {
        if (!cancelled) setSections(result.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setSections([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function renderSections(parentId: string | null, depth: number) {
    if (!sections || depth > 3) return null
    const children = sections.filter((section) => section.parentId === parentId)
    if (children.length === 0) return null
    return (
      <ul
        className={cx(
          styles.sectionLinks,
          depth > 1 && styles.nestedSectionLinks,
        )}
      >
        {children.map((section) => (
          <li key={section.id}>
            <Link to={`/documents#${section.slug}`} onClick={onNavigate}>
              {section.title}
            </Link>
            {renderSections(section.id, depth + 1)}
          </li>
        ))}
      </ul>
    )
  }

  if (sections === null)
    return <span className={styles.dropdownStatus}>Загружаем разделы…</span>
  return (
    renderSections(null, 1) ?? (
      <span className={styles.dropdownStatus}>Разделы пока недоступны</span>
    )
  )
}

export function HeaderDropdown({
  onNavigate,
  mobile = false,
}: {
  onNavigate: () => void
  mobile?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdown = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  function navigate() {
    setIsOpen(false)
    onNavigate()
  }

  useEffect(() => {
    if (!isOpen) return
    function onOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !dropdown.current?.contains(event.target)
      )
        setIsOpen(false)
    }
    document.addEventListener('pointerdown', onOutsideClick)
    return () => document.removeEventListener('pointerdown', onOutsideClick)
  }, [isOpen])

  return (
    <div
      className={cx(styles.dropdownContainer, mobile && styles.mobileDropdown)}
      ref={dropdown}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false)
          toggle.current?.focus()
        }
      }}
    >
      <div className={styles.dropdownTrigger}>
        <NavLink
          to="/documents"
          onClick={navigate}
          className={mobile ? styles.mobileLink : styles.navLink}
        >
          Документы
        </NavLink>
        <button
          ref={toggle}
          type="button"
          className={styles.dropdownToggle}
          aria-label="Разделы документов"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
        </button>
      </div>
      <div className={styles.dropdownMenu} id={panelId} hidden={!isOpen}>
        {isOpen && <SectionLinks onNavigate={navigate} />}
      </div>
    </div>
  )
}
