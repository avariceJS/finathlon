import type { Olympiad } from './types.ts'

export type RegistrationState = 'upcoming' | 'open' | 'closed'

// Olympiad dates are calendar dates in the organiser's timezone, including the end day.
export function getRegistrationState(
  olympiad: Pick<
    Olympiad,
    'status' | 'isPublished' | 'registrationOpen' | 'startDate' | 'endDate'
  >,
  now = new Date(),
): RegistrationState {
  if (!olympiad.isPublished || olympiad.status !== 'published') return 'closed'
  if (olympiad.registrationOpen !== null)
    return olympiad.registrationOpen ? 'open' : 'closed'
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  if (olympiad.startDate && today < olympiad.startDate) return 'upcoming'
  if (olympiad.endDate && today > olympiad.endDate) return 'closed'
  return 'open'
}
