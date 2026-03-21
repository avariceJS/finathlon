import { Section } from '@/shared/ui/section/Section'

import styles from './AboutSection.module.css'

type AboutSectionProps = {
  paragraphs: string[]
}

export function AboutSection({ paragraphs }: AboutSectionProps) {
  return (
    <Section title="О Финатлоне">
      <div className={styles.content}>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
    </Section>
  )
}