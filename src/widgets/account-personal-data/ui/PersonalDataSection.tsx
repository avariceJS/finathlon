import { useState } from 'react'

import type { AccountField } from '@/pages/account/model/types'
import { ProfileField } from '@/entities/account/ui/ProfileField'

import styles from './PersonalDataSection.module.css'

type PersonalDataSectionProps = {
  fields: AccountField[]
}

function toRecord(fields: AccountField[]) {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.id] = field.value
    return acc
  }, {})
}

export function PersonalDataSection({
  fields,
}: PersonalDataSectionProps) {
  const initialValues = toRecord(fields)

  const [savedValues, setSavedValues] =
    useState<Record<string, string>>(initialValues)
  const [draftValues, setDraftValues] =
    useState<Record<string, string>>(initialValues)
  const [isEditing, setIsEditing] = useState(false)

  const handleStartEdit = () => {
    setDraftValues(savedValues)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setDraftValues(savedValues)
    setIsEditing(false)
  }

  const handleSave = () => {
    setSavedValues(draftValues)
    setIsEditing(false)
  }

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div />
        <div className={styles.actions}>
          {isEditing ? (
            <>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={handleCancel}
              >
                Отмена
              </button>

              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleSave}
              >
                Сохранить
              </button>
            </>
          ) : (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={handleStartEdit}
            >
              Редактировать
            </button>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {fields.map((field) => (
          <ProfileField
            key={field.id}
            label={field.label}
            type={field.type}
            value={isEditing ? draftValues[field.id] : savedValues[field.id]}
            editable={isEditing}
            onChange={(value) =>
              setDraftValues((prev) => ({
                ...prev,
                [field.id]: value,
              }))
            }
          />
        ))}
      </div>
    </section>
  )
}