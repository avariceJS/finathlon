import type { AboutSetting } from '@/shared/api'
import { Section } from '@/shared/ui/section/Section'

import styles from './AboutSection.module.css'

type AboutSectionProps = {
  about: AboutSetting
}

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <Section id="about" title={about.title}>
      <div className={styles.content}>
        {about.paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
    </Section>
  )
}
