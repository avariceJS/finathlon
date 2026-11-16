import assert from 'node:assert/strict'
import test from 'node:test'
import { getRegistrationState } from '../../src/entities/olympiad/registration.ts'

const event = {
  status: 'published',
  isPublished: true,
  registrationOpen: null,
  startDate: '2026-11-17',
  endDate: '2026-11-17',
}

test('calendar dates use Moscow time and include the whole last day', () => {
  assert.equal(
    getRegistrationState(event, new Date('2026-11-16T20:59:59Z')),
    'upcoming',
  )
  assert.equal(
    getRegistrationState(event, new Date('2026-11-16T21:00:00Z')),
    'open',
  )
  assert.equal(
    getRegistrationState(event, new Date('2026-11-17T20:59:59Z')),
    'open',
  )
  assert.equal(
    getRegistrationState(event, new Date('2026-11-17T21:00:00Z')),
    'closed',
  )
})

test('manual state overrides dates but cannot expose drafts or archived events', () => {
  const now = new Date('2027-01-01T00:00:00Z')
  assert.equal(
    getRegistrationState({ ...event, registrationOpen: true }, now),
    'open',
  )
  assert.equal(
    getRegistrationState({ ...event, registrationOpen: false }, now),
    'closed',
  )
  for (const status of ['draft', 'archived', 'completed']) {
    assert.equal(
      getRegistrationState({ ...event, status, registrationOpen: true }, now),
      'closed',
    )
  }
  assert.equal(
    getRegistrationState(
      { ...event, isPublished: false, registrationOpen: true },
      now,
    ),
    'closed',
  )
})

test('optional dates leave a published event open', () => {
  assert.equal(
    getRegistrationState({ ...event, startDate: null, endDate: null }),
    'open',
  )
})
