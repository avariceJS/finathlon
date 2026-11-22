import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'

import {
  DEMO_GRADES,
  DEMO_PROFILES,
  DEMO_SIZE,
  demoOptions,
} from '@/entities/demo-test/model'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { Select } from '@/shared/ui/select/Select'

import styles from './DemoTest.module.css'

export function DemoStartSection() {
  const navigate = useNavigate()

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const query = new URLSearchParams({
      profile: String(form.get('profile')),
      grades: String(form.get('grades')),
    })
    navigate(`/demo-test?${query}`)
  }

  return (
    <section
      className={styles.homeSection}
      id="demo-test"
      aria-labelledby="demo-test-heading"
    >
      <Container>
        <div className={styles.homePanel}>
          <div className={styles.stack}>
            <h2 id="demo-test-heading">Демо-тестирование</h2>
            <p>
              Решите {DEMO_SIZE} олимпиадных заданий и разберите ошибки после
              теста.
            </p>
          </div>
          <form className={styles.homeForm} onSubmit={start}>
            <Select
              label="Профиль"
              name="profile"
              options={demoOptions(DEMO_PROFILES)}
            />
            <Select
              label="Классы"
              name="grades"
              options={demoOptions(DEMO_GRADES)}
            />
            <Button type="submit">Начать демо-тест</Button>
          </form>
        </div>
      </Container>
    </section>
  )
}
