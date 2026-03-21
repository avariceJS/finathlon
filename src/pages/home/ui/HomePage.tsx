import { homePageMock } from '../model/mocks'

import { AboutSection } from '@/widgets/about/ui/AboutSection'
import { FaqSection } from '@/widgets/faq/ui/FaqSection'
import { Footer } from '@/widgets/footer/ui/Footer'
import { Header } from '@/widgets/header/ui/Header'
import { HeroSection } from '@/widgets/hero/ui/HeroSection'
import { NewsSection } from '@/widgets/news/ui/NewsSection'
import { ParticipationSection } from '@/widgets/participation/ui/ParticipationSection'
import { StatsSection } from '@/widgets/stats/ui/StatsSection'
import { TimelineSection } from '@/widgets/timeline/ui/TimelineSection'

import styles from './HomePage.module.css'

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