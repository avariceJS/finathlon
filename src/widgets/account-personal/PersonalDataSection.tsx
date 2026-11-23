import { useState, type FormEvent } from 'react'

import {
  EMPTY_PROFILE_FORM,
  validateQuestionnaire,
  type Profile,
  type ProfileFormValues,
  type QuestionnaireErrors,
  type QuestionnaireField,
} from '@/entities/profile'
import { QuestionnaireFields } from '@/features/questionnaire'
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

export function PersonalDataSection(props: PersonalDataSectionProps) {
  const key = [
    props.profile?.updatedAt ?? '',
    props.profile?.id ?? 'anon',
  ].join('::')
  return <PersonalDataSectionView key={key} {...props} />
}

function profileToValues(profile: Profile | null): ProfileFormValues {
  if (!profile) return EMPTY_PROFILE_FORM
  const values = { ...EMPTY_PROFILE_FORM }
  for (const field of Object.keys(values) as QuestionnaireField[]) {
    values[field] = profile[field] as never
  }
  return values
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
  const [fieldErrors, setFieldErrors] = useState<QuestionnaireErrors>({})
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

  const changeField = (field: QuestionnaireField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const updateField =
    (field: QuestionnaireField) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      changeField(field, event.target.value)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.id) return
    const invalid = validateQuestionnaire(values, {
      requireAll: false,
      today: todayLocalISODate(),
    })
    setFieldErrors(invalid)
    if (Object.keys(invalid).length > 0) {
      setError('Проверьте поля, выделенные красным.')
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
    setFieldErrors({})
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
        <QuestionnaireFields
          values={values}
          errors={fieldErrors}
          onChange={changeField}
          disabled={!isEditing}
          personalExtra={
            <>
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
                  hint="Email изменить нельзя"
                />
              )}
            </>
          }
        />

        <fieldset className={styles.block}>
          <legend className={styles.legend}>Соцсети и о себе</legend>
          <div className={styles.grid}>
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
        </fieldset>
      </form>
    </section>
  )
}
