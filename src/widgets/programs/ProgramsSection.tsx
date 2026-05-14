import type { Program } from '@/entities/program'
import { Button } from '@/shared/ui/button/Button'
import { Card } from '@/shared/ui/card/Card'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'
import { Section } from '@/shared/ui/section/Section'

import styles from './ProgramsSection.module.css'

type ProgramsSectionProps = {
  programs: Program[]
}

export function ProgramsSection({ programs }: ProgramsSectionProps) {
  return (
    <Section
      id="participate"
      title="Как принять участие"
      description="Три направления для разной аудитории — от школьников до студентов и профессионалов."
    >
      {programs.length === 0 ? (
        <EmptyState
          title="Пока нет программ"
          description="Администратор ещё не настроил карточки программ. Они появятся здесь автоматически."
        />
      ) : (
        <div className={styles.grid}>
          {programs.map((program) => (
            <Card
              key={program.id}
              className={styles.card}
              hoverable
              padded={false}
            >
              <div className={styles.inner}>
                <header className={styles.head}>
                  <h3 className={styles.title}>{program.title}</h3>
                  {program.summary ? (
                    <p className={styles.summary}>{program.summary}</p>
                  ) : null}
                </header>

                {program.highlights.length > 0 ? (
                  <ul className={styles.list}>
                    {program.highlights.map((point) => (
                      <li key={point} className={styles.item}>
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className={styles.actions}>
                  <Button
                    to={program.ctaHref ?? `/events/${program.slug}`}
                    fullWidth
                  >
                    {program.ctaLabel}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  )
}
