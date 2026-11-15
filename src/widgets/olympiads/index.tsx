import { Container } from '@/shared/ui/container/Container'
import type { Olympiad } from '@/entities/olympiad'

interface OlympiadsSectionProps {
  olympiads: Olympiad[]
}

const STAGE_LABELS: Record<string, string> = {
  qualifying: 'Отборочный этап',
  selection: 'Отборочный этап',
  final: 'Заключительный (очный) этап',
  onsite: 'Очный этап',
  registration: 'Открыта регистрация',
  archive: 'Завершена',
  archived: 'Завершена',
}

// Безопасный разбор даты без сдвига часовых поясов
function parseLocalDate(dateStr: string | null | undefined, isEndOfDay = false): Date | null {
  if (!dateStr) return null
  const cleanStr = dateStr.split('T')[0]
  const parts = cleanStr.split('-')
  if (parts.length === 3) {
    const year = Number(parts[0])
    const month = Number(parts[1]) - 1
    const day = Number(parts[2])
    return isEndOfDay
      ? new Date(year, month, day, 23, 59, 59, 999)
      : new Date(year, month, day, 0, 0, 0, 0)
  }
  const fallback = new Date(dateStr)
  return isNaN(fallback.getTime()) ? null : fallback
}

export function OlympiadsSection({ olympiads }: OlympiadsSectionProps) {
  if (!olympiads || olympiads.length === 0) return null

  // Показываем ВСЕ опубликованные олимпиады (и активные, и завершенные)
  const displayList = olympiads.filter(
    (item: any) => item.status === 'published' || item.isPublished
  )

  if (displayList.length === 0) return null

  const handleRegisterClick = (slug: string) => {
    window.location.href = `/auth?olympiad=${encodeURIComponent(slug)}`
  }

  return (
    <section style={{ padding: '64px 0', backgroundColor: '#f8fafc' }}>
      <Container>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px 0', color: '#0f172a' }}>
            Олимпиады и профили
          </h2>
          <p style={{ fontSize: '16px', color: '#475569', margin: 0 }}>
            Выберите свой профиль. У каждого направления отдельная регистрация и история участия.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '28px',
            alignItems: 'stretch',
          }}
        >
          {displayList.map((item: any, index: number) => {
            const now = new Date()
            const start = parseLocalDate(item.startDate || item.start_date, false)
            const end = parseLocalDate(item.endDate || item.end_date, true)

            // Проверка по датам из ТЗ
            const isNotStarted = start ? now < start : false
            const isEnded =
              (end ? now > end : false) ||
              item.stage === 'archive' ||
              item.stage === 'archived' ||
              item.status === 'archived'

            let statusLabel = STAGE_LABELS[item.stage] || item.stage || 'Отборочный этап'
            if (isNotStarted) {
              statusLabel = 'Ожидается открытие регистрации'
            } else if (isEnded) {
              statusLabel = 'Завершено'
            } else {
              statusLabel = `${STAGE_LABELS[item.stage] || 'Отборочный этап'}`
            }

            const isFirstTheme = index % 2 === 0
            const theme = isFirstTheme
              ? {
                  border: '#2563eb',
                  cardBg: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 140px)',
                  badgeBg: '#dbeafe',
                  badgeText: '#1e40af',
                  profileColor: '#1d4ed8',
                  buttonBg: '#2563eb',
                }
              : {
                  border: '#059669',
                  cardBg: 'linear-gradient(180deg, #ecfdf5 0%, #ffffff 140px)',
                  badgeBg: '#d1fae5',
                  badgeText: '#065f46',
                  profileColor: '#047857',
                  buttonBg: '#059669',
                }

            return (
              <div
                key={item.id || index}
                style={{
                  background: theme.cardBg,
                  backgroundColor: '#ffffff',
                  border: `2px solid ${theme.border}`,
                  borderTop: `8px solid ${theme.border}`,
                  borderRadius: '18px',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '5px 12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        backgroundColor: theme.badgeBg,
                        color: theme.badgeText,
                      }}
                    >
                      Сезон {item.season || '2026–2027'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '6px' }}>
                      {statusLabel}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#0f172a', lineHeight: 1.3 }}>
                    {item.title || 'Финатлон'}
                  </h3>
                  <h4 style={{ fontSize: '18px', margin: '0 0 14px 0', color: theme.profileColor, fontWeight: 700, lineHeight: 1.3 }}>
                    {item.profileTitle || 'Профиль олимпиады'}
                  </h4>

                  <p style={{ color: '#334155', marginBottom: '20px', whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '14px' }}>
                    {item.description || 'Описание профиля олимпиады.'}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: 1.6 }}>
                    <div>
                      <strong>Начало:</strong> {start ? start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </div>
                    <div>
                      <strong>Окончание:</strong> {end ? end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </div>
                  </div>

                  {/* Если этап не начался или закончился — показываем текст, иначе — кнопку */}
                  {isNotStarted && start ? (
                    <div style={{ fontSize: '13px', color: '#1e40af', textAlign: 'center', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '10px', fontWeight: 600 }}>
                      Регистрация начнется {start.toLocaleDateString('ru-RU')}
                    </div>
                  ) : isEnded ? (
                    <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '12px', background: 'none', fontWeight: 500 }}>
                      Регистрация и тестирование завершены
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegisterClick(item.slug || item.id)}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        backgroundColor: theme.buttonBg,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      Зарегистрироваться и пройти тестирование
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
