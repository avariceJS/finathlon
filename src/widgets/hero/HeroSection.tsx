import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import type { HeroSetting } from '@/shared/api'

import styles from './HeroSection.module.css'

type HeroSectionProps = {
  hero: HeroSetting
}

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <Container className={styles.inner}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Финансовая олимпиада &middot; Викторина &middot; Форум</p>
          <h1 className={styles.title}>{hero.title}</h1>
          <p className={styles.subtitle}>{hero.subtitle}</p>
          <div className={styles.actions}>
            <Button to="/events" size="lg">
              Выбрать мероприятие
            </Button>
            <Button to="/news" size="lg" variant="secondary">
              Свежие новости
            </Button>
          </div>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <img
            src="/banner.jpg"
            alt=""
            className={styles.image}
          />
        </div>
      </Container>
    </section>
  )
}
