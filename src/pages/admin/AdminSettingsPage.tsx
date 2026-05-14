import { useEffect, useState } from 'react'

import { siteSettingsApi } from '@/shared/api'
import {
  DEFAULT_ABOUT_SETTING,
  DEFAULT_CONTACTS_SETTING,
  DEFAULT_HERO_SETTING,
} from '@/shared/api/site-settings'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Card } from '@/shared/ui/card/Card'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { AdminLayout } from '@/widgets/admin-layout'

import styles from './admin-form.module.css'

export function AdminSettingsPage() {
  const [hero, setHero] = useState(DEFAULT_HERO_SETTING)
  const [about, setAbout] = useState({
    title: DEFAULT_ABOUT_SETTING.title,
    paragraphs: DEFAULT_ABOUT_SETTING.paragraphs.join('\n\n'),
  })
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS_SETTING)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    siteSettingsApi
      .fetchSiteSettings()
      .then((res) => {
        if (cancelled) return
        if (res.error) {
          setError(res.error)
        } else if (res.data) {
          setHero(res.data.hero)
          setAbout({
            title: res.data.about.title,
            paragraphs: res.data.about.paragraphs.join('\n\n'),
          })
          setContacts(res.data.contacts)
        }
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveHero = async () => {
    setSaving('hero')
    setError(null)
    setInfo(null)
    const result = await siteSettingsApi.saveSiteSetting('hero', {
      title: hero.title,
      subtitle: hero.subtitle,
    })
    setSaving(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo('Hero обновлён')
  }

  const handleSaveAbout = async () => {
    setSaving('about')
    setError(null)
    setInfo(null)
    const paragraphs = about.paragraphs
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
    const result = await siteSettingsApi.saveSiteSetting('about', {
      title: about.title,
      paragraphs,
    })
    setSaving(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo('Блок «О Финатлоне» обновлён')
  }

  const handleSaveContacts = async () => {
    setSaving('contacts')
    setError(null)
    setInfo(null)
    const result = await siteSettingsApi.saveSiteSetting('contacts', {
      phone: contacts.phone,
      email: contacts.email,
      address: contacts.address,
    })
    setSaving(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo('Контакты обновлены')
  }

  return (
    <AdminLayout
      title="Контент сайта"
      description="Тексты главной страницы и контакты для футера."
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      {info ? <Alert variant="success">{info}</Alert> : null}

      {isLoading ? (
        <Spinner label="Загружаем настройки..." />
      ) : (
        <>
          <Card padded={false}>
            <div className={styles.form}>
              <h2 className={styles.formTitle}>Hero-блок</h2>
              <TextField
                label="Заголовок"
                value={hero.title}
                onChange={(e) =>
                  setHero((p) => ({ ...p, title: e.target.value }))
                }
              />
              <TextField
                multiline
                label="Подзаголовок"
                value={hero.subtitle}
                onChange={(e) =>
                  setHero((p) => ({ ...p, subtitle: e.target.value }))
                }
                rows={3}
              />
              <div className={styles.formActions}>
                <Button onClick={handleSaveHero} loading={saving === 'hero'}>
                  Сохранить Hero
                </Button>
              </div>
            </div>
          </Card>

          <Card padded={false}>
            <div className={styles.form}>
              <h2 className={styles.formTitle}>О Финатлоне</h2>
              <TextField
                label="Заголовок раздела"
                value={about.title}
                onChange={(e) =>
                  setAbout((p) => ({ ...p, title: e.target.value }))
                }
              />
              <TextField
                multiline
                label="Параграфы (пустая строка — разделитель)"
                value={about.paragraphs}
                onChange={(e) =>
                  setAbout((p) => ({ ...p, paragraphs: e.target.value }))
                }
                rows={8}
              />
              <div className={styles.formActions}>
                <Button onClick={handleSaveAbout} loading={saving === 'about'}>
                  Сохранить раздел
                </Button>
              </div>
            </div>
          </Card>

          <Card padded={false}>
            <div className={styles.form}>
              <h2 className={styles.formTitle}>Контакты</h2>
              <div className={styles.grid2}>
                <TextField
                  label="Телефон"
                  value={contacts.phone}
                  onChange={(e) =>
                    setContacts((p) => ({ ...p, phone: e.target.value }))
                  }
                />
                <TextField
                  label="Email"
                  type="email"
                  value={contacts.email}
                  onChange={(e) =>
                    setContacts((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <TextField
                label="Адрес"
                value={contacts.address}
                onChange={(e) =>
                  setContacts((p) => ({ ...p, address: e.target.value }))
                }
              />
              <div className={styles.formActions}>
                <Button
                  onClick={handleSaveContacts}
                  loading={saving === 'contacts'}
                >
                  Сохранить контакты
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </AdminLayout>
  )
}
