import { useState, type FormEvent } from 'react'

import type { Profile, ProfileFormValues } from '@/entities/profile'
import { profileApi } from '@/shared/api'
import { useAuth } from '@/shared/auth'
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

  const updateField =
    (field: keyof ProfileFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id) return
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
          Заполните имя, фамилию, город, телефон и дату рождения, чтобы открыть
          участие в мероприятиях.
        </Alert>
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

          <TextField
            label="Email"
            value={profile?.email || email || ''}
            disabled
            hint="Изменение email пока недоступно"
          />
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
