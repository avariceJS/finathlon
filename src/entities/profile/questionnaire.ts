import type { ProfileFormValues, YesNo } from './types'

type Option = { value: string; label: string }

const toOptions = (items: string[]): Option[] =>
  items.map((item) => ({ value: item, label: item }))

/** Сайт рассчитан на участников из России: страна не выбирается. */
export const RUSSIA = 'Российская Федерация'

export const FEDERAL_DISTRICT_OPTIONS = toOptions([
  'Центральный федеральный округ',
  'Южный федеральный округ',
  'Северо-Западный федеральный округ',
  'Дальневосточный федеральный округ',
  'Сибирский федеральный округ',
  'Уральский федеральный округ',
  'Приволжский федеральный округ',
  'Северо-Кавказский федеральный округ',
  'Новый федеральный округ',
])

export const REGION_OPTIONS = toOptions([
  'Алтайский край',
  'Амурская область',
  'Архангельская область',
  'Астраханская область',
  'Байконур',
  'Белгородская область',
  'Брянская область',
  'Владимирская область',
  'Волгоградская область',
  'Вологодская область',
  'Воронежская область',
  'Донецкая Народная Республика',
  'Еврейская автономная область',
  'Забайкальский край',
  'Запорожская область',
  'Ивановская область',
  'Иркутская область',
  'Кабардино-Балкарская Республика',
  'Калининградская область',
  'Калужская область',
  'Камчатский край',
  'Карачаево-Черкесская Республика',
  'Кемеровская область',
  'Кировская область',
  'Костромская область',
  'Краснодарский край',
  'Красноярский край',
  'Курганская область',
  'Курская область',
  'Ленинградская область',
  'Липецкая область',
  'Луганская Народная Республика',
  'Магаданская область',
  'Москва',
  'Московская область',
  'Мурманская область',
  'Ненецкий автономный округ',
  'Нижегородская область',
  'Новгородская область',
  'Новосибирская область',
  'Омская область',
  'Оренбургская область',
  'Орловская область',
  'Пензенская область',
  'Пермский край',
  'Приморский край',
  'Псковская область',
  'Республика Адыгея (Адыгея)',
  'Республика Алтай',
  'Республика Башкортостан',
  'Республика Бурятия',
  'Республика Дагестан',
  'Республика Ингушетия',
  'Республика Калмыкия',
  'Республика Карелия',
  'Республика Коми',
  'Республика Крым',
  'Республика Марий Эл',
  'Республика Мордовия',
  'Республика Саха (Якутия)',
  'Республика Северная Осетия (Алания)',
  'Республика Татарстан (Татарстан)',
  'Республика Тыва (Тува)',
  'Республика Хакасия',
  'Ростовская область',
  'Рязанская область',
  'Самарская область',
  'Санкт-Петербург',
  'Саратовская область',
  'Сахалинская область',
  'Свердловская область',
  'Севастополь',
  'Смоленская область',
  'Ставропольский край',
  'Тамбовская область',
  'Тверская область',
  'Томская область',
  'Тульская область',
  'Тюменская область',
  'Удмуртская Республика',
  'Ульяновская область',
  'Хабаровский край',
  'Ханты-Мансийский автономный округ - Югра',
  'Херсонская область',
  'Челябинская область',
  'Чеченская Республика',
  'Чувашская Республика',
  'Чукотский автономный округ',
  'Ямало-Ненецкий автономный округ',
  'Ярославская область',
])

export const LOCALITY_TYPE_OPTIONS = toOptions([
  'город',
  'поселок',
  'село',
  'аул',
  'деревня',
  'районный центр',
  'станица',
  'хутор',
  'сельское поселение',
  'городское поселение',
  'поселок городского типа',
  'рабочий поселок',
  'другое',
])

export const CLASS_OPTIONS = toOptions(['6-7', '8', '9', '10', '11'])

export const YES_NO_OPTIONS: Option[] = [
  { value: 'no', label: 'нет' },
  { value: 'yes', label: 'да' },
]

export const EMPTY_PROFILE_FORM: ProfileFormValues = {
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
  federalDistrict: '',
  region: '',
  postalCode: '',
  localityType: '',
  address: '',
  isRural: '',
  schoolAddress: '',
  schoolPhone: '',
  schoolEmail: '',
  isOrphan: '',
  hasDisability: '',
  motivation: '',
  financeInterest: '',
  infoSource: '',
  parentFullName: '',
  parentEmail: '',
  parentPhone: '',
  organizations: '',
  teacherFullName: '',
  teacherPhone: '',
  teacherEmail: '',
}

export type QuestionnaireField = keyof ProfileFormValues
export type QuestionnaireErrors = Partial<Record<QuestionnaireField, string>>

/** Поля анкеты, обязательные при регистрации на профиль олимпиады. */
export const REQUIRED_QUESTIONNAIRE_FIELDS: QuestionnaireField[] = [
  'lastName',
  'firstName',
  'birthDate',
  'federalDistrict',
  'region',
  'postalCode',
  'localityType',
  'city',
  'address',
  'isRural',
  'phone',
  'classCourse',
  'school',
  'schoolAddress',
  'schoolPhone',
  'schoolEmail',
  'isOrphan',
  'hasDisability',
  'motivation',
  'financeInterest',
  'infoSource',
  'parentFullName',
  'parentEmail',
  'parentPhone',
  'middleName',
  'organizations',
  'teacherFullName',
  'teacherPhone',
  'teacherEmail',
]

export function isQuestionnaireFieldRequired(
  field: QuestionnaireField,
): boolean {
  return REQUIRED_QUESTIONNAIRE_FIELDS.includes(field)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CYRILLIC_NAME_RE = /^[А-ЯЁа-яё]+(?:[ -][А-ЯЁа-яё]+)*$/
const PHONE_CHARS_RE = /^\+?[\d\s()-]+$/
const MIN_BIRTH_DATE = '1950-01-01'

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

function isValidPhone(value: string): boolean {
  const trimmed = value.trim()
  if (!PHONE_CHARS_RE.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '').length
  return digits >= 10 && digits <= 15
}

const NAME_FIELDS: QuestionnaireField[] = ['lastName', 'firstName', 'middleName']
const FULL_NAME_FIELDS: QuestionnaireField[] = [
  'parentFullName',
  'teacherFullName',
]
const PHONE_FIELDS: QuestionnaireField[] = [
  'phone',
  'schoolPhone',
  'parentPhone',
  'teacherPhone',
]
const EMAIL_FIELDS: QuestionnaireField[] = [
  'schoolEmail',
  'parentEmail',
  'teacherEmail',
]

/**
 * Проверяет анкету. При `requireAll` дополнительно проверяется заполнение
 * обязательных полей (регистрация); без него — только формат введённого
 * (редактирование в личном кабинете).
 */
export function validateQuestionnaire(
  values: ProfileFormValues,
  options: { requireAll: boolean; today: string },
): QuestionnaireErrors {
  const errors: QuestionnaireErrors = {}
  const filled = (field: QuestionnaireField) => values[field].trim() !== ''

  if (options.requireAll) {
    for (const field of Object.keys(values) as QuestionnaireField[]) {
      if (isQuestionnaireFieldRequired(field) && !filled(field)) {
        errors[field] = 'Заполните это поле'
      }
    }
  }

  for (const field of NAME_FIELDS) {
    if (filled(field) && !CYRILLIC_NAME_RE.test(values[field].trim())) {
      errors[field] = 'Используйте только буквы русского алфавита'
    }
  }

  for (const field of FULL_NAME_FIELDS) {
    if (!filled(field)) continue
    const value = values[field].trim()
    if (!CYRILLIC_NAME_RE.test(value)) {
      errors[field] = 'Используйте только буквы русского алфавита'
    } else if (value.split(/\s+/).length < 2) {
      errors[field] = 'Укажите фамилию и имя полностью'
    }
  }

  for (const field of PHONE_FIELDS) {
    if (filled(field) && !isValidPhone(values[field])) {
      errors[field] = 'Укажите телефон в формате +7 (999) 123-45-67'
    }
  }

  for (const field of EMAIL_FIELDS) {
    if (filled(field) && !isValidEmail(values[field])) {
      errors[field] = 'Введите корректный e-mail, например name@mail.ru'
    }
  }

  if (filled('birthDate')) {
    if (values.birthDate > options.today) {
      errors.birthDate = 'Дата рождения не может быть позже сегодняшнего дня'
    } else if (values.birthDate < MIN_BIRTH_DATE) {
      errors.birthDate = 'Проверьте год рождения'
    }
  }

  if (filled('postalCode') && !/^\d{6}$/.test(values.postalCode.trim())) {
    errors.postalCode = 'Индекс должен состоять из 6 цифр'
  }

  return errors
}

const yesNoToBoolean = (value: YesNo): boolean | null =>
  value === '' ? null : value === 'yes'

export const booleanToYesNo = (value: boolean | null | undefined): YesNo =>
  value === null || value === undefined ? '' : value ? 'yes' : 'no'

/** Анкета в формате столбцов таблицы `profiles` (без соцсетей и «о себе»). */
export function questionnaireToRow(values: ProfileFormValues) {
  const text = (value: string) => value.trim() || null
  return {
    last_name: text(values.lastName),
    first_name: text(values.firstName),
    middle_name: text(values.middleName),
    birth_date: values.birthDate || null,
    country: RUSSIA,
    federal_district: text(values.federalDistrict),
    region: text(values.region),
    postal_code: text(values.postalCode),
    locality_type: text(values.localityType),
    city: text(values.city),
    address: text(values.address),
    is_rural: yesNoToBoolean(values.isRural),
    phone: text(values.phone),
    class_course: text(values.classCourse),
    school: text(values.school),
    school_address: text(values.schoolAddress),
    school_phone: text(values.schoolPhone),
    school_email: text(values.schoolEmail)?.toLowerCase() ?? null,
    is_orphan: yesNoToBoolean(values.isOrphan),
    has_disability: yesNoToBoolean(values.hasDisability),
    motivation: text(values.motivation),
    finance_interest: text(values.financeInterest),
    info_source: text(values.infoSource),
    parent_full_name: text(values.parentFullName),
    parent_email: text(values.parentEmail)?.toLowerCase() ?? null,
    parent_phone: text(values.parentPhone),
    organizations: text(values.organizations),
    teacher_full_name: text(values.teacherFullName),
    teacher_phone: text(values.teacherPhone),
    teacher_email: text(values.teacherEmail)?.toLowerCase() ?? null,
  }
}
