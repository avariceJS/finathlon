import { AboutSection } from '@/widgets/about'
import { FaqSection } from '@/widgets/faq'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'
import { HeroSection } from '@/widgets/hero'
import { NewsSection } from '@/widgets/news'
import { ProgramsSection } from '@/widgets/programs'
import { StatsSection } from '@/widgets/stats'
import { TimelineSection } from '@/widgets/timeline'
import { Alert } from '@/shared/ui/alert/Alert'
import { Container } from '@/shared/ui/container/Container'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { Spinner } from '@/shared/ui/spinner/Spinner'

import { useHomeData } from './useHomeData'

export function HomePage() {
  const { data, isLoading, error } = useHomeData()

  return (
    <PageLayout
      header={<Header />}
      footer={<Footer contacts={data.contacts} />}
    >
      <HeroSection hero={data.hero} />

      {error ? (
        <Container>
          <Alert variant="error" title="Не удалось загрузить данные">
            {error}
          </Alert>
        </Container>
      ) : null}

      {isLoading ? (
        <Container>
          <Spinner label="Загружаем главную страницу..." />
        </Container>
      ) : (
        <>
          <ProgramsSection programs={data.programs} />
          <StatsSection items={data.stats} />
          <TimelineSection events={data.timeline} />
          <NewsSection news={data.news} />
          <AboutSection about={data.about} />
          <FaqSection items={data.faqs} />
        </>
      )}
    </PageLayout>
  )
}
