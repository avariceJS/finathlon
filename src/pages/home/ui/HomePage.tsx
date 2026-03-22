import { homePageMock } from '../model/mocks'

import { AboutSection } from '@/widgets/about'
import { FaqSection } from '@/widgets/faq'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'
import { HeroSection } from '@/widgets/hero'
import { NewsSection } from '@/widgets/news'
import { ParticipationSection } from '@/widgets/participation'
import { StatsSection } from '@/widgets/stats'
import { TimelineSection } from '@/widgets/timeline'

import styles from '../styles/HomePage.module.css'

export function HomePage() {
  const data = homePageMock

  return (
    <div className={styles.page}>
      <Header navigation={data.navigation} />

      <main className={styles.main}>
        <HeroSection hero={data.hero} />
        <ParticipationSection items={data.participation} />
        <StatsSection items={data.stats} />
        <TimelineSection items={data.timeline} />
        <NewsSection items={data.news} />
        <AboutSection paragraphs={data.aboutParagraphs} />
        <FaqSection items={data.faq} />
      </main>

      <Footer
        contacts={data.contacts}
        columns={data.footerColumns}
        socials={data.socials}
      />
    </div>
  )
}