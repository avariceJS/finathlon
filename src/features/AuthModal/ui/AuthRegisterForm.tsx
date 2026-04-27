import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'

import { TextField } from '@/shared/ui/text-field/TextField'

import type { RegisterFormState } from '../types'
import styles from '../styles/AuthModal.module.css'

type AuthRegisterFormProps = {
  registerForm: RegisterFormState
  errorMessage: string
  onFieldChange: (
    field: keyof RegisterFormState,
  ) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  onClose: () => void
}

export function AuthRegisterForm({
  registerForm,
  errorMessage,
  onFieldChange,
  onSubmit,
  onClose,
}: AuthRegisterFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const stepFields = useMemo<Record<1 | 2 | 3, Array<keyof RegisterFormState>>>(
    () => ({
      1: [
        'login',
        'password',
        'lastName',
        'firstName',
        'middleName',
        'email',
        'phone',
        'birthDate',
        'country',
        'federalDistrict',
        'region',
        'postalCode',
        'localityType',
        'locality',
        'school',
        'classCourse',
      ],
      2: [
        'schoolName',
        'schoolAddress',
        'schoolPhone',
        'schoolEmail',
        'teacherFullName',
        'teacherPhone',
        'teacherEmail',
        'parentFullName',
        'parentPhone',
        'parentEmail',
      ],
      3: ['olympiadReason', 'financeInterest'],
    }),
    [],
  )

  const isStepFilled = (targetStep: 1 | 2 | 3) => {
    return stepFields[targetStep].every((field) => {
      const value = registerForm[field]
      return typeof value === 'string' && value.trim().length > 0
    })
  }

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    if (step === 3) {
      onSubmit(event)
      return
    }

    event.preventDefault()
    if (!isStepFilled(step)) {
      return
    }
    setStep((prev) => (prev === 1 ? 2 : 3))
  }

  return (
    <form className={styles.registerForm} onSubmit={handleContinue}>
      <header className={styles.registerHeader}>
        <span className={styles.registerLogo} aria-hidden="true">
          <span className={styles.registerLogoRed} />
          <span className={styles.registerLogoGray} />
        </span>
        <h2 className={styles.registerTitle}>Регистрация</h2>
        <button
          className={styles.registerClose}
          type="button"
          onClick={onClose}
          aria-label="Закрыть окно регистрации"
        >
          ×
        </button>
      </header>

      <div className={styles.registerDivider} />

      {step === 1 ? (
        <>
          <section className={styles.registerSection}>
        <h3 className={styles.sectionTitle}>Пользователь</h3>
        <div className={styles.fieldsGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Логин</span>
            <TextField
              className={styles.registerInput}
              name="login"
              placeholder="Мой логин*"
              value={registerForm.login}
              onChange={onFieldChange('login')}
              autoComplete="username"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Пароль</span>
            <TextField
              className={styles.registerInput}
              name="password"
              type="password"
              placeholder="Мой пароль*"
              value={registerForm.password}
              onChange={onFieldChange('password')}
              autoComplete="new-password"
              required
            />
          </label>
        </div>
          </section>

          <section className={styles.registerSection}>
        <h3 className={styles.sectionTitle}>Личные данные</h3>
        <div className={styles.fieldsGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Фамилия</span>
            <TextField
              className={styles.registerInput}
              name="lastName"
              placeholder="Моя фамилия*"
              value={registerForm.lastName}
              onChange={onFieldChange('lastName')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Имя</span>
            <TextField
              className={styles.registerInput}
              name="firstName"
              placeholder="Мое имя*"
              value={registerForm.firstName}
              onChange={onFieldChange('firstName')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Отчество</span>
            <TextField
              className={styles.registerInput}
              name="middleName"
              placeholder="Мое отчество*"
              value={registerForm.middleName}
              onChange={onFieldChange('middleName')}
              required
            />
          </label>
        </div>
          </section>

          <section className={styles.registerSection}>
        <div className={styles.fieldsGrid}>
          <label className={styles.field}>
            <span className={styles.label}>E-mail</span>
            <TextField
              className={styles.registerInput}
              name="email"
              type="email"
              placeholder="@*"
              value={registerForm.email}
              onChange={onFieldChange('email')}
              autoComplete="email"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Телефон</span>
            <TextField
              className={styles.registerInput}
              name="phone"
              placeholder="+7*"
              value={registerForm.phone}
              onChange={onFieldChange('phone')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Дата рождения</span>
            <TextField
              className={styles.registerInput}
              name="birthDate"
              type="date"
              placeholder="ДД.ММ.ГГГГ*"
              value={registerForm.birthDate}
              onChange={onFieldChange('birthDate')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Страна</span>
            <TextField
              className={styles.registerInput}
              name="country"
              placeholder="Моя страна*"
              value={registerForm.country}
              onChange={onFieldChange('country')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Федеральный округ</span>
            <TextField
              className={styles.registerInput}
              name="federalDistrict"
              placeholder="Центральный, Южный...*"
              value={registerForm.federalDistrict}
              onChange={onFieldChange('federalDistrict')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Субъект РФ</span>
            <TextField
              className={styles.registerInput}
              name="region"
              placeholder="Республика, край, область...*"
              value={registerForm.region}
              onChange={onFieldChange('region')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Почтовый индекс</span>
            <TextField
              className={styles.registerInput}
              name="postalCode"
              placeholder="Индекс*"
              value={registerForm.postalCode}
              onChange={onFieldChange('postalCode')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Тип населенного пункта</span>
            <select
              className={styles.select}
              name="localityType"
              value={registerForm.localityType}
              onChange={onFieldChange('localityType')}
              required
            >
              <option value="" disabled>
                Выберите
              </option>
              <option value="Город">Город</option>
              <option value="Село">Село</option>
              <option value="Поселок">Поселок</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Населенный пункт</span>
            <TextField
              className={styles.registerInput}
              name="locality"
              placeholder="Город, село...*"
              value={registerForm.locality}
              onChange={onFieldChange('locality')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Школа/Колледж</span>
            <TextField
              className={styles.registerInput}
              name="school"
              placeholder="*"
              value={registerForm.school}
              onChange={onFieldChange('school')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Класс/Курс</span>
            <TextField
              className={styles.registerInput}
              name="classCourse"
              placeholder="*"
              value={registerForm.classCourse}
              onChange={onFieldChange('classCourse')}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Сирота</span>
            <select
              className={styles.select}
              name="orphan"
              value={registerForm.orphan}
              onChange={onFieldChange('orphan')}
              required
            >
              <option value="" disabled>
                Выберите
              </option>
              <option value="Да">Да</option>
              <option value="Нет">Нет</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>ОВЗ (ограниченные возможности здоровья)</span>
            <textarea
              className={styles.textarea}
              name="ovz"
              placeholder="Введите свой ответ"
              value={registerForm.ovz}
              onChange={onFieldChange('ovz')}
              rows={3}
            />
          </label>
        </div>
          </section>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <section className={styles.registerSection}>
            <h3 className={styles.sectionTitle}>Личные данные</h3>
            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Название</span>
                <TextField
                  className={styles.registerInput}
                  name="schoolName"
                  placeholder="Лицей, МБОУ...*"
                  value={registerForm.schoolName}
                  onChange={onFieldChange('schoolName')}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Адрес</span>
                <TextField
                  className={styles.registerInput}
                  name="schoolAddress"
                  placeholder="ул....*"
                  value={registerForm.schoolAddress}
                  onChange={onFieldChange('schoolAddress')}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Телефон</span>
                <TextField
                  className={styles.registerInput}
                  name="schoolPhone"
                  placeholder="+7*"
                  value={registerForm.schoolPhone}
                  onChange={onFieldChange('schoolPhone')}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>E-mail</span>
                <TextField
                  className={styles.registerInput}
                  name="schoolEmail"
                  type="email"
                  placeholder="@*"
                  value={registerForm.schoolEmail}
                  onChange={onFieldChange('schoolEmail')}
                  required
                />
              </label>
            </div>
          </section>

          <section className={styles.registerSection}>
            <h3 className={styles.sectionTitle}>Дополнительно</h3>
            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span className={styles.label}>ФИО учителя</span>
                <TextField
                  className={styles.registerInput}
                  name="teacherFullName"
                  placeholder="ФИО*"
                  value={registerForm.teacherFullName}
                  onChange={onFieldChange('teacherFullName')}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Телефон учителя</span>
                <TextField
                  className={styles.registerInput}
                  name="teacherPhone"
                  placeholder="+7*"
                  value={registerForm.teacherPhone}
                  onChange={onFieldChange('teacherPhone')}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>E-mail учителя</span>
                <TextField
                  className={styles.registerInput}
                  name="teacherEmail"
                  type="email"
                  placeholder="@*"
                  value={registerForm.teacherEmail}
                  onChange={onFieldChange('teacherEmail')}
                  required
                />
              </label>
            </div>
          </section>

          <div className={styles.registerDivider} />

          <section className={styles.registerSection}>
            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span className={styles.label}>ФИО родителя</span>
                <TextField
                  className={styles.registerInput}
                  name="parentFullName"
                  placeholder="ФИО*"
                  value={registerForm.parentFullName}
                  onChange={onFieldChange('parentFullName')}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Телефон родителя</span>
                <TextField
                  className={styles.registerInput}
                  name="parentPhone"
                  placeholder="+7*"
                  value={registerForm.parentPhone}
                  onChange={onFieldChange('parentPhone')}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>E-mail родителя</span>
                <TextField
                  className={styles.registerInput}
                  name="parentEmail"
                  type="email"
                  placeholder="@*"
                  value={registerForm.parentEmail}
                  onChange={onFieldChange('parentEmail')}
                  required
                />
              </label>
            </div>
          </section>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <section className={styles.registerSection}>
            <h3 className={styles.questionTitle}>
              Чем вызвано мое решение принять участие в олимпиаде?
            </h3>
            <textarea
              className={styles.questionTextarea}
              name="olympiadReason"
              placeholder="*"
              value={registerForm.olympiadReason}
              onChange={onFieldChange('olympiadReason')}
              rows={4}
              required
            />
          </section>
          <section className={styles.registerSection}>
            <h3 className={styles.questionTitle}>Почему меня интересует сфера финансов?</h3>
            <textarea
              className={styles.questionTextarea}
              name="financeInterest"
              placeholder="*"
              value={registerForm.financeInterest}
              onChange={onFieldChange('financeInterest')}
              rows={4}
              required
            />
          </section>
        </>
      ) : null}

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

      <p className={styles.policyText}>
        Продолжая, вы соглашаетесь на обработку своих персональных данных на
        условиях{' '}
        <a href="#" className={styles.policyLink}>
          согласия на обработку персональных данных
        </a>{' '}
        и принимаете условия{' '}
        <a href="#" className={styles.policyLink}>
          Пользовательского соглашения
        </a>
        .
      </p>

      <div className={styles.registerSubmitRow}>
        <button className={styles.registerButton} type="submit">
          Продолжить
        </button>
      </div>
    </form>
  )
}
