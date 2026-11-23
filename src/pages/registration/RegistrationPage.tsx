import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import type { RegistrationOlympiad } from '@/entities/olympiad'
import {
  EMPTY_PROFILE_FORM,
  isValidEmail,
  validateQuestionnaire,
  type Profile,
  type ProfileFormValues,
  type QuestionnaireErrors,
  type QuestionnaireField,
} from '@/entities/profile'
import { QuestionnaireFields } from '@/features/questionnaire'
import { olympiadApi, siteSettingsApi, type ContactsSetting } from '@/shared/api'
import { ALREADY_REGISTERED_MESSAGE } from '@/shared/api/olympiad'
import { DEFAULT_CONTACTS_SETTING } from '@/shared/api/site-settings'
import {
  registerWithProfile,
  signInWithCredentials,
  useAuth,
} from '@/shared/auth'
import { formatDateTime, todayLocalISODate } from '@/shared/lib/format'
import { supabase } from '@/shared/supabase'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { Select } from '@/shared/ui/select/Select'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'

import styles from './RegistrationPage.module.css'

const SUBMIT_LABEL = 'Зарегистрироваться и перейти к тестированию'

function profileLabel(profile: RegistrationOlympiad): string {
  return `${profile.olympiadTitle} — ${profile.profileTitle} (${profile.season})`
}

export function RegistrationPage() {
  const [searchParams] = useSearchParams()
  const requestedId = searchParams.get('profile')
  const { user, profile, isAuthLoading } = useAuth()

  const [profiles, setProfiles] = useState<RegistrationOlympiad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )
  // Кабинет подставляется в анкету один раз — при первом показе формы.
  const [isFormShown, setIsFormShown] = useState(false)

  useEffect(() => {
    let cancelled = false
    olympiadApi.listVisibleProfiles().then((res) => {
      if (cancelled) return
      setProfiles(res.data ?? [])
      setLoadError(res.error)
      setIsLoading(false)
    })
    siteSettingsApi.fetchSiteSettings().then((res) => {
      if (cancelled || !res.data) return
      setContacts(res.data.contacts)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const openProfiles = profiles.filter((item) => item.availability === 'open')
  const requested = requestedId
    ? (profiles.find((item) => item.id === requestedId) ?? null)
    : null
  const isReady =
    !isLoading &&
    !isAuthLoading &&
    (isFormShown || !user || profile !== null)

  useEffect(() => {
    if (isReady && !isFormShown) setIsFormShown(true)
  }, [isReady, isFormShown])

  let body
  if (!isReady) {
    body = <Spinner label="Загружаем форму регистрации..." />
  } else if (loadError) {
    body = (
      <Alert variant="error" title="Не удалось загрузить профили олимпиады">
        {loadError}
      </Alert>
    )
  } else if (requestedId && (!requested || requested.availability !== 'open')) {
    body = (
      <ClosedNotice profile={requested} hasOtherOpen={openProfiles.length > 0} />
    )
  } else if (openProfiles.length === 0) {
    body = <NoOpenProfilesNotice profiles={profiles} />
  } else {
    body = (
      <RegistrationForm
        profiles={openProfiles}
        initialProfileId={requested?.id ?? ''}
        initialProfile={profile}
      />
    )
  }

  return (
    <PageLayout header={<Header />} footer={<Footer contacts={contacts} />}>
      <PageHeader
        eyebrow="Отборочное тестирование"
        title="Регистрация участника"
        description="Выберите профиль олимпиады и заполните анкету. Личный кабинет будет создан автоматически, а после отправки формы вы сразу перейдёте к тестированию."
      />
      <Container className={styles.container}>{body}</Container>
    </PageLayout>
  )
}

function ClosedNotice({
  profile,
  hasOtherOpen,
}: {
  profile: RegistrationOlympiad | null
  hasOtherOpen: boolean
}) {
  let title = 'Регистрация недоступна'
  let text =
    'Профиль олимпиады не найден или больше не доступен для регистрации.'

  if (profile?.availability === 'upcoming') {
    title = 'Регистрация ещё не началась'
    text = profile.startsAt
      ? `Регистрация и тестирование по профилю «${profile.profileTitle}» начнутся ${formatDateTime(profile.startsAt)}.`
      : `Регистрация и тестирование по профилю «${profile.profileTitle}» ещё не начались.`
  } else if (profile) {
    title = 'Регистрация завершена'
    text = `Регистрация и тестирование по профилю «${profile.profileTitle}» завершены.`
  }

  return (
    <div className={styles.notice}>
      <Alert variant="warning" title={title}>
        {text}
      </Alert>
      <div className={styles.noticeActions}>
        {hasOtherOpen ? (
          <Button to="/registration">Выбрать другой профиль</Button>
        ) : null}
        <Button to="/" variant="secondary">
          На главную
        </Button>
      </div>
    </div>
  )
}

function NoOpenProfilesNotice({ profiles }: { profiles: RegistrationOlympiad[] }) {
  const upcoming = profiles.filter((item) => item.availability === 'upcoming')

  return (
    <div className={styles.notice}>
      <Alert
        variant="warning"
        title={
          upcoming.length > 0
            ? 'Регистрация ещё не началась'
            : 'Сейчас нет открытой регистрации'
        }
      >
        {upcoming.length > 0 ? (
          <ul className={styles.noticeList}>
            {upcoming.map((item) => (
              <li key={item.id}>
                {profileLabel(item)}
                {item.startsAt
                  ? ` — начало ${formatDateTime(item.startsAt)}`
                  : ''}
              </li>
            ))}
          </ul>
        ) : (
          'Регистрация и тестирование по профилям олимпиады завершены или ещё не объявлены. Следите за новостями на сайте.'
        )}
      </Alert>
      <div className={styles.noticeActions}>
        <Button to="/" variant="secondary">
          На главную
        </Button>
      </div>
    </div>
  )
}

type AccountValues = {
  email: string
  password: string
  passwordConfirm: string
}

type FormErrors = QuestionnaireErrors &
  Partial<Record<keyof AccountValues | 'olympiadProfileId', string>>

type FormNotice = {
  title: string
  text: string
  action?: { label: string; to: string }
}

const EMPTY_ACCOUNT: AccountValues = {
  email: '',
  password: '',
  passwordConfirm: '',
}

function initialValues(profile: Profile | null): ProfileFormValues {
  if (!profile) return EMPTY_PROFILE_FORM
  const values = { ...EMPTY_PROFILE_FORM }
  for (const field of Object.keys(values) as QuestionnaireField[]) {
    values[field] = profile[field] as never
  }
  return values
}

function RegistrationForm({
  profiles,
  initialProfileId,
  initialProfile,
}: {
  profiles: RegistrationOlympiad[]
  initialProfileId: string
  initialProfile: Profile | null
}) {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)

  const [profileId, setProfileId] = useState(
    initialProfileId || (profiles.length === 1 ? profiles[0].id : ''),
  )
  const [account, setAccount] = useState<AccountValues>(EMPTY_ACCOUNT)
  const [values, setValues] = useState<ProfileFormValues>(() =>
    initialValues(initialProfile),
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [notice, setNotice] = useState<FormNotice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selected = profiles.find((item) => item.id === profileId) ?? null
  const errorCount = Object.keys(errors).length

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })

  const handleFieldChange = (field: QuestionnaireField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    clearError(field)
  }

  const handleAccountChange = (field: keyof AccountValues, value: string) => {
    setAccount((prev) => ({ ...prev, [field]: value }))
    clearError(field)
  }

  const focusFirstInvalid = (invalid: FormErrors) => {
    const form = formRef.current
    if (!form) return
    for (const element of Array.from(form.elements)) {
      const name = element.getAttribute('name')
      if (name && name in invalid && element instanceof HTMLElement) {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' })
        element.focus({ preventScroll: true })
        return
      }
    }
  }

  const validate = (): FormErrors => {
    const next: FormErrors = validateQuestionnaire(values, {
      requireAll: true,
      today: todayLocalISODate(),
    })
    if (!profileId) next.olympiadProfileId = 'Выберите профиль олимпиады'

    if (!user) {
      if (!account.email.trim()) {
        next.email = 'Заполните это поле'
      } else if (!isValidEmail(account.email)) {
        next.email = 'Введите корректный e-mail, например name@mail.ru'
      }
      if (!account.password) {
        next.password = 'Придумайте пароль'
      } else if (account.password.length < 6) {
        next.password = 'Пароль должен быть не короче 6 символов'
      }
      if (!account.passwordConfirm) {
        next.passwordConfirm = 'Повторите пароль'
      } else if (account.password !== account.passwordConfirm) {
        next.passwordConfirm = 'Пароли не совпадают'
      }
    }
    return next
  }

  const showNotice = (next: FormNotice) => {
    setNotice(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showAlreadyRegistered = () =>
    showNotice({
      title: 'Повторная регистрация невозможна',
      text: ALREADY_REGISTERED_MESSAGE,
      action: user
        ? { label: 'Перейти в личный кабинет', to: '/account/olympiads' }
        : {
            label: 'Войти в личный кабинет',
            to: `/auth?next=${encodeURIComponent('/account/olympiads')}`,
          },
    })

  /** Создаёт кабинет или входит в существующий. Возвращает false при неудаче. */
  const ensureAccount = async (email: string): Promise<boolean> => {
    if (user) return true

    const created = await registerWithProfile({
      email,
      password: account.password,
      firstName: values.firstName,
      lastName: values.lastName,
    })

    if (created.code === 'email_taken') {
      const login = await signInWithCredentials({
        loginOrEmail: email,
        password: account.password,
      })
      if (login.error) {
        showNotice({
          title: 'Личный кабинет с такой почтой уже существует',
          text: 'Войдите в него и вернитесь к регистрации — новый профиль добавится в ваш кабинет, создавать его заново не нужно.',
          action: {
            label: 'Войти в личный кабинет',
            to: `/auth?next=${encodeURIComponent(`/registration?profile=${profileId}`)}`,
          },
        })
        return false
      }
    } else if (created.error) {
      showNotice({ title: 'Не удалось создать личный кабинет', text: created.error })
      return false
    }

    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      showNotice({
        title: 'Подтвердите почту',
        text: 'Личный кабинет создан. Перейдите по ссылке из письма, войдите в кабинет и завершите регистрацию на профиль.',
      })
      return false
    }
    return true
  }

  const submit = async () => {
    const email = (user?.email ?? account.email).trim().toLowerCase()

    if (!(await ensureAccount(email))) return

    const registration = await olympiadApi.registerForProfile(profileId, values)
    if (registration.error) {
      if (registration.error === ALREADY_REGISTERED_MESSAGE) {
        showAlreadyRegistered()
      } else {
        showNotice({
          title: 'Не удалось завершить регистрацию',
          text: registration.error,
        })
      }
      return
    }

    await refreshProfile()
    navigate(`/testing/${profileId}`, { replace: true })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setNotice(null)

    const invalid = validate()
    setErrors(invalid)
    if (Object.keys(invalid).length > 0) {
      focusFirstInvalid(invalid)
      return
    }

    setIsSubmitting(true)
    try {
      await submit()
    } catch (err) {
      showNotice({
        title: 'Не удалось отправить форму',
        text: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
    >
      {notice ? (
        <div className={styles.notice}>
          <Alert variant="error" title={notice.title}>
            {notice.text}
          </Alert>
          {notice.action ? (
            <div className={styles.noticeActions}>
              <Button to={notice.action.to}>{notice.action.label}</Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className={styles.lead}>
        Все поля формы регистрации обязательны к заполнению. При вводе ФИО
        используйте только буквы русского алфавита.
      </p>

      <fieldset className={styles.block}>
        <legend className={styles.legend}>Профиль олимпиады</legend>
        <Select
          name="olympiadProfileId"
          label="Профиль олимпиады *"
          value={profileId}
          onChange={(event) => {
            setProfileId(event.target.value)
            clearError('olympiadProfileId')
          }}
          options={profiles.map((item) => ({
            value: item.id,
            label: profileLabel(item),
          }))}
          placeholder="Выберите профиль"
          error={errors.olympiadProfileId}
          hint="На каждый профиль можно зарегистрироваться только один раз."
        />
        {selected ? (
          <div className={styles.profileInfo}>
            {selected.summary ? <p>{selected.summary}</p> : null}
            {selected.endsAt ? (
              <p className={styles.profileDates}>
                Регистрация и тестирование открыты до{' '}
                {formatDateTime(selected.endsAt)}.
              </p>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <fieldset className={styles.block}>
        <legend className={styles.legend}>Личный кабинет</legend>
        {user ? (
          <Alert variant="info">
            Вы вошли как {user.email}. Регистрация на профиль будет добавлена в
            ваш личный кабинет.
          </Alert>
        ) : (
          <>
            <div className={styles.accountGrid}>
              <TextField
                name="email"
                label="E-mail *"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@mail.ru"
                value={account.email}
                onChange={(e) => handleAccountChange('email', e.target.value)}
                error={errors.email}
                hint="Будет логином для входа в личный кабинет"
              />
              <TextField
                name="password"
                label="Пароль *"
                type="password"
                autoComplete="new-password"
                value={account.password}
                onChange={(e) => handleAccountChange('password', e.target.value)}
                error={errors.password}
                hint="Минимум 6 символов"
              />
              <TextField
                name="passwordConfirm"
                label="Повторите пароль *"
                type="password"
                autoComplete="new-password"
                value={account.passwordConfirm}
                onChange={(e) =>
                  handleAccountChange('passwordConfirm', e.target.value)
                }
                error={errors.passwordConfirm}
              />
            </div>
            <p className={styles.accountHint}>
              С этой почтой и паролем вы сможете войти в личный кабинет после
              тестирования. Уже есть кабинет?{' '}
              <Button
                to={`/auth?next=${encodeURIComponent(
                  profileId
                    ? `/registration?profile=${profileId}`
                    : '/registration',
                )}`}
                variant="ghost"
                size="sm"
              >
                Войти
              </Button>
            </p>
          </>
        )}
      </fieldset>

      <QuestionnaireFields
        values={values}
        errors={errors}
        onChange={handleFieldChange}
        disabled={isSubmitting}
        markRequired
      />

      <div className={styles.submit}>
        {errorCount > 0 ? (
          <Alert variant="error" title="Форма заполнена не полностью">
            Исправьте поля, выделенные красным: {errorCount}.
          </Alert>
        ) : null}
        <Button type="submit" size="lg" loading={isSubmitting} fullWidth>
          {SUBMIT_LABEL}
        </Button>
        <p className={styles.submitNote}>
          После отправки формы вы будете зарегистрированы на выбранный профиль
          и сразу перейдёте к тестированию. Личный кабинет будет создан
          автоматически.
        </p>
        <p className={styles.terms}>
          Отправляя форму, вы соглашаетесь с{' '}
          <a href="/terms" target="_blank" rel="noreferrer">
            условиями использования
          </a>{' '}
          сервиса и{' '}
          <a href="/privacy" target="_blank" rel="noreferrer">
            политикой обработки персональных данных
          </a>
          .
        </p>
      </div>
    </form>
  )
}
