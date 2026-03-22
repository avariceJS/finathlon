import type { HeroData } from '@/pages/home/model/types'
import { Container } from '@/shared/ui/container/Container'

import styles from '../styles/HeroSection.module.css'

type HeroSectionProps = {
  hero: HeroData
}

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <Container className={styles.inner}>
        <div className={styles.content}>
          <h1 className={styles.title}>{hero.title}</h1>
        </div>

        <div className={styles.visual} aria-label={hero.imageAlt}>
          <span className={styles.visualText}>Изображение</span>
        </div>
      </Container>
    </section>
  )
}