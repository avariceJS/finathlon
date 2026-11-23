import type { ReactNode } from 'react'

import {
  CLASS_OPTIONS,
  FEDERAL_DISTRICT_OPTIONS,
  LOCALITY_TYPE_OPTIONS,
  REGION_OPTIONS,
  YES_NO_OPTIONS,
  isQuestionnaireFieldRequired,
  type ProfileFormValues,
  type QuestionnaireErrors,
  type QuestionnaireField,
} from '@/entities/profile'
import { todayLocalISODate } from '@/shared/lib/format'
import { Select } from '@/shared/ui/select/Select'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './QuestionnaireFields.module.css'

type Option = { value: string; label: string }

type QuestionnaireFieldsProps = {
  values: ProfileFormValues
  errors: QuestionnaireErrors
  onChange: (field: QuestionnaireField, value: string) => void
  disabled?: boolean
  /** Помечать обязательные поля звёздочкой (форма регистрации). */
  markRequired?: boolean
  /** Дополнительные поля в начале блока «Личные данные» (логин, e-mail). */
  personalExtra?: ReactNode
}

/** Сохраняет в списке значение, которого нет среди вариантов (старые данные). */
function withCurrent(options: Option[], current: string): Option[] {
  if (!current || options.some((option) => option.value === current)) {
    return options
  }
  return [{ value: current, label: current }, ...options]
}

export function QuestionnaireFields({
  values,
  errors,
  onChange,
  disabled = false,
  markRequired = false,
  personalExtra,
}: QuestionnaireFieldsProps) {
  const label = (field: QuestionnaireField, text: string) =>
    markRequired && isQuestionnaireFieldRequired(field)
      ? `${text} *`
      : text

  const text = (
    field: QuestionnaireField,
    title: string,
    extra: {
      type?: string
      placeholder?: string
      hint?: string
      autoComplete?: string
      inputMode?: 'text' | 'tel' | 'email' | 'numeric'
      max?: string
      maxLength?: number
      wide?: boolean
    } = {},
  ) => {
    const { wide, ...inputProps } = extra
    return (
      <TextField
        name={field}
        label={label(field, title)}
        value={values[field]}
        onChange={(event) => onChange(field, event.target.value)}
        error={errors[field]}
        disabled={disabled}
        containerClassName={wide ? styles.wide : undefined}
        {...inputProps}
      />
    )
  }

  const area = (field: QuestionnaireField, title: string) => (
    <TextField
      multiline
      name={field}
      label={label(field, title)}
      value={values[field]}
      onChange={(event) => onChange(field, event.target.value)}
      error={errors[field]}
      disabled={disabled}
      rows={3}
      maxLength={2000}
      containerClassName={styles.full}
    />
  )

  const select = (
    field: QuestionnaireField,
    title: string,
    options: Option[],
    hint?: string,
  ) => (
    <Select
      name={field}
      label={label(field, title)}
      value={values[field]}
      onChange={(event) => onChange(field, event.target.value)}
      options={withCurrent(options, values[field])}
      placeholder="Выберите значение"
      error={errors[field]}
      hint={hint}
      disabled={disabled}
    />
  )

  return (
    <>
      <fieldset className={styles.block}>
        <legend className={styles.legend}>Личные данные</legend>
        <div className={styles.grid}>
          {personalExtra}
          {text('lastName', 'Фамилия', { autoComplete: 'family-name' })}
          {text('firstName', 'Имя', { autoComplete: 'given-name' })}
          {text('middleName', 'Отчество', {
            autoComplete: 'additional-name',
          })}
          {text('birthDate', 'Дата рождения', {
            type: 'date',
            max: todayLocalISODate(),
            autoComplete: 'bday',
          })}
          {text('phone', 'Контактный телефон', {
            type: 'tel',
            inputMode: 'tel',
            autoComplete: 'tel',
            placeholder: '+7 (999) 123-45-67',
          })}
        </div>
      </fieldset>

      <fieldset className={styles.block}>
        <legend className={styles.legend}>Место жительства</legend>
        <div className={styles.grid}>
          {select(
            'federalDistrict',
            'Федеральный округ',
            FEDERAL_DISTRICT_OPTIONS,
          )}
          {select('region', 'Субъект РФ', REGION_OPTIONS)}
          {text('postalCode', 'Почтовый индекс', {
            inputMode: 'numeric',
            autoComplete: 'postal-code',
            maxLength: 6,
            placeholder: '101000',
          })}
          {select(
            'localityType',
            'Тип населённого пункта',
            LOCALITY_TYPE_OPTIONS,
          )}
          {text('city', 'Название населённого пункта', {
            autoComplete: 'address-level2',
          })}
          {text('address', 'Адрес места жительства', {
            autoComplete: 'street-address',
            hint: 'Улица, дом, квартира',
            wide: true,
          })}
          {select(
            'isRural',
            'Являюсь жителем сельской местности',
            YES_NO_OPTIONS,
          )}
        </div>
      </fieldset>

      <fieldset className={styles.block}>
        <legend className={styles.legend}>Образование</legend>
        <div className={styles.grid}>
          {select(
            'classCourse',
            'Класс / соответствующий курс обучения',
            CLASS_OPTIONS,
          )}
          {text('school', 'Название образовательного учреждения', {
            autoComplete: 'organization',
            wide: true,
          })}
          {text('schoolPhone', 'Телефон образовательного учреждения', {
            type: 'tel',
            inputMode: 'tel',
            placeholder: '+7 (495) 123-45-67',
          })}
          {text('schoolAddress', 'Адрес образовательного учреждения', {
            hint: 'Индекс, страна, город, улица, дом',
            wide: true,
          })}
          {text('schoolEmail', 'E-mail образовательного учреждения', {
            type: 'email',
            inputMode: 'email',
            placeholder: 'school@mail.ru',
          })}
        </div>
      </fieldset>

      <fieldset className={styles.block}>
        <legend className={styles.legend}>Родитель или опекун</legend>
        <div className={styles.grid}>
          {text('parentFullName', 'ФИО одного из родителей или опекуна')}
          {text('parentPhone', 'Телефон родителя или опекуна', {
            type: 'tel',
            inputMode: 'tel',
            placeholder: '+7 (999) 123-45-67',
          })}
          {text('parentEmail', 'E-mail родителя или опекуна', {
            type: 'email',
            inputMode: 'email',
            placeholder: 'name@mail.ru',
          })}
        </div>
      </fieldset>

      <fieldset className={styles.block}>
        <legend className={styles.legend}>Учитель</legend>
        <div className={styles.grid}>
          {text('teacherFullName', 'ФИО учителя')}
          {text('teacherPhone', 'Телефон учителя', {
            type: 'tel',
            inputMode: 'tel',
            placeholder: '+7 (999) 123-45-67',
          })}
          {text('teacherEmail', 'E-mail учителя', {
            type: 'email',
            inputMode: 'email',
            placeholder: 'name@mail.ru',
          })}
        </div>
      </fieldset>

      <fieldset className={styles.block}>
        <legend className={styles.legend}>Дополнительные сведения</legend>
        <div className={styles.grid}>
          {select('isOrphan', 'Имею статус ребёнка-сироты', YES_NO_OPTIONS)}
          {select(
            'hasDisability',
            'Являюсь лицом с ограниченными возможностями здоровья',
            YES_NO_OPTIONS,
          )}
          {text(
            'organizations',
            'Членство в детско-юношеских организациях, движениях',
            { hint: 'Наименование. Если не состоите — напишите «нет»' },
          )}
          {area('motivation', 'Чем вызвано моё решение принять участие в олимпиаде')}
          {area('financeInterest', 'Почему меня интересует сфера финансов')}
          {area('infoSource', 'Источник информации об олимпиаде')}
        </div>
      </fieldset>
    </>
  )
}
