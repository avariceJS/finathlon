import { useState, type FormEvent } from 'react'

import type { Profile, ProfileFormValues } from '@/entities/profile'
import { profileApi } from '@/shared/api'
import { useAuth, requestAuthEmailChange } from '@/shared/auth'
import { isSyntheticAuthEmail } from '@/shared/config/auth-login'
import { todayLocalISODate } from '@/shared/lib/format'
import { supabase } from '@/shared/supabase'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './PersonalDataSection.module.css'

type PersonalDataSectionProps = {
  profile: Profile | null
  email: string | null
}

const EMPTY: ProfileFormValues = {
  firstName: '',
  lastName: '',
  middleName: '',
  phone: '',
  birthDate: '',
  country: '',
  city: '',
  school: '',
  classCourse: '',
  telegram: '',
  vk: '',
  bio: '',
}

export function PersonalDataSection(props: PersonalDataSectionProps) {
  const key = [
    props.profile?.updatedAt ?? '',
    props.profile?.id ?? 'anon',
  ].join('::')
  return <PersonalDataSectionView key={key} {...props} />
}

function profileToValues(profile: Profile | null): ProfileFormValues {
  if (!profile) return EMPTY
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    middleName: profile.middleName,
    phone: profile.phone,
    birthDate: profile.birthDate,
    country: profile.country,
    city: profile.city,
    school: profile.school,
    classCourse: profile.classCourse,
    telegram: profile.telegram,
    vk: profile.vk,
    bio: profile.bio,
  }
}

function PersonalDataSectionView({
  profile,
  email,
}: PersonalDataSectionProps) {
  const { user, refreshProfile } = useAuth()
  const [values, setValues] = useState<ProfileFormValues>(() =>
    profileToValues(profile),
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [emailChangeValue, setEmailChangeValue] = useState('')
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null)
  const [emailChangeInfo, setEmailChangeInfo] = useState<string | null>(null)
  const [isEmailSaving, setIsEmailSaving] = useState(false)

  const displayEmail = profile?.email || email || ''
  const needsRealEmail =
    Boolean(profile?.username) && isSyntheticAuthEmail(displayEmail)

  const pendingEmail =
    user && typeof user === 'object' && 'new_email' in user
      ? (user as { new_email?: string | null }).new_email ?? null
      : null

  const updateField =
    (field: keyof ProfileFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id) return
    const today = todayLocalISODate()
    if (values.birthDate && values.birthDate > today) {
      setError('Дата рождения не может быть позже сегодняшнего дня')
      setInfo(null)
      return
    }
    setError(null)
    setInfo(null)
    setIsSaving(true)
    const result = await profileApi.updateMyProfile(user.id, values)
    setIsSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo('Профиль обновлён')
    setIsEditing(false)
    await refreshProfile()
  }

  const handleCancel = () => {
    setValues(profileToValues(profile))
    setIsEditing(false)
    setError(null)
    setInfo(null)
  }

  const handleEmailChangeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEmailChangeError(null)
    setEmailChangeInfo(null)
    setIsEmailSaving(true)
    const result = await requestAuthEmailChange(emailChangeValue)
    setIsEmailSaving(false)
    if (result.error) {
      setEmailChangeError(result.error)
      return
    }
    setEmailChangeInfo(
      'Проверьте почту и перейдите по ссылке, чтобы подтвердить адрес.',
    )
    setEmailChangeValue('')
    await supabase.auth.refreshSession()
    await refreshProfile()
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <div>
          <h2 className={styles.title}>Личные данные</h2>
          <p className={styles.subtitle}>
            Эти данные нужны, чтобы организаторы могли связаться с вами и
            подтвердить участие.
          </p>
        </div>

        {isEditing ? (
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              form="profile-form"
              loading={isSaving}
            >
              Сохранить
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Редактировать</Button>
        )}
      </header>

      {error ? (
        <Alert variant="error" title="Не удалось сохранить">
          {error}
        </Alert>
      ) : null}
      {info ? <Alert variant="success">{info}</Alert> : null}
      {!profile?.isComplete && !isEditing ? (
        <Alert variant="warning" title="Профиль заполнен не до конца">
          Заполните имя, фамилию, город, телефон и дату рождения.
          {profile?.username
            ? ' Учётная запись выдана по логину — укажите и подтвердите настоящую почту ниже.'
            : null}
        </Alert>
      ) : null}

      {needsRealEmail ? (
        <form
          className={styles.emailAttachForm}
          onSubmit={handleEmailChangeSubmit}
        >
          <h3 className={styles.emailAttachTitle}>Настоящая почта</h3>
          {emailChangeError ? (
            <Alert variant="error">{emailChangeError}</Alert>
          ) : null}
          {emailChangeInfo ? (
            <Alert variant="success">{emailChangeInfo}</Alert>
          ) : null}
          {pendingEmail ? (
            <Alert variant="info" title="Ожидается подтверждение">
              {pendingEmail}
            </Alert>
          ) : null}
          <TextField
            label="Ваш email"
            type="email"
            required
            autoComplete="email"
            value={emailChangeValue}
            onChange={(e) => setEmailChangeValue(e.target.value)}
            hint="После сохранения откройте письмо и подтвердите адрес."
          />
          <Button type="submit" loading={isEmailSaving}>
            Отправить письмо
          </Button>
        </form>
      ) : null}

      <form id="profile-form" className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <TextField
            label="Имя"
            value={values.firstName}
            onChange={updateField('firstName')}
            disabled={!isEditing}
            autoComplete="given-name"
          />
          <TextField
            label="Фамилия"
            value={values.lastName}
            onChange={updateField('lastName')}
            disabled={!isEditing}
            autoComplete="family-name"
          />
          <TextField
            label="Отчество"
            value={values.middleName}
            onChange={updateField('middleName')}
            disabled={!isEditing}
            autoComplete="additional-name"
          />

          {profile?.username ? (
            <TextField
              label="Логин"
              value={profile.username}
              disabled
              hint="Используйте при входе вместе с паролем."
            />
          ) : null}

          {needsRealEmail ? (
            <TextField
              label="Служебный email"
              value={displayEmail}
              disabled
              hint="Не для переписки. Укажите личную почту в блоке выше."
            />
          ) : (
            <TextField
              label="Email"
              value={displayEmail}
              disabled
              hint="Изменение email пока недоступно"
            />
          )}
          <TextField
            label="Телефон"
            value={values.phone}
            onChange={updateField('phone')}
            disabled={!isEditing}
            autoComplete="tel"
            placeholder="+7 (___) ___-__-__"
          />
          <TextField
            label="Дата рождения"
            type="date"
            max={todayLocalISODate()}
            value={values.birthDate}
            onChange={updateField('birthDate')}
            disabled={!isEditing}
          />

          <TextField
            label="Страна"
            value={values.country}
            onChange={updateField('country')}
            disabled={!isEditing}
            placeholder="Россия"
          />
          <TextField
            label="Город"
            value={values.city}
            onChange={updateField('city')}
            disabled={!isEditing}
            placeholder="Москва"
          />
          <TextField
            label="Школа / ВУЗ"
            value={values.school}
            onChange={updateField('school')}
            disabled={!isEditing}
          />
          <TextField
            label="Класс / курс"
            value={values.classCourse}
            onChange={updateField('classCourse')}
            disabled={!isEditing}
            placeholder="11 класс / 2 курс"
          />

          <TextField
            label="Telegram"
            value={values.telegram}
            onChange={updateField('telegram')}
            disabled={!isEditing}
            placeholder="@username"
          />
          <TextField
            label="VK"
            value={values.vk}
            onChange={updateField('vk')}
            disabled={!isEditing}
            placeholder="vk.com/username"
          />
        </div>

        <TextField
          multiline
          label="О себе"
          value={values.bio}
          onChange={updateField('bio')}
          disabled={!isEditing}
          hint="Кратко расскажите о своих интересах и целях участия."
          rows={4}
        />
      </form>
    </section>
  )
}
