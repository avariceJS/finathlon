import { supabase } from '@/shared/supabase'
import type { Json, SiteSettingRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

export type HeroSetting = {
  title: string
  subtitle: string
}

export type AboutSetting = {
  title: string
  paragraphs: string[]
}

export type ContactsSetting = {
  phone: string
  email: string
  address: string
}

const DEFAULT_HERO: HeroSetting = {
  title: 'Финатлон — платформа для финансовых олимпиад, викторин и форумов',
  subtitle:
    'Развиваем финансовую грамотность школьников и студентов, поддерживаем талантливых ребят и объединяем экспертов вокруг идеи устойчивой экономики.',
}

const DEFAULT_ABOUT: AboutSetting = {
  title: 'О Финатлоне',
  paragraphs: [
    'Финатлон — это масштабная образовательная инициатива по развитию финансовой грамотности, поддержке талантливых школьников и продвижению принципов устойчивого развития в экономике и обществе.',
  ],
}

const DEFAULT_CONTACTS: ContactsSetting = {
  phone: '+7 (495) 123-45-67',
  email: 'finatlon@fin.ru',
  address: 'Москва, ул. Профсоюзная, 65',
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: Json | undefined, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function readStringArray(value: Json | undefined): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export async function fetchSiteSettings(): Promise<
  ApiResult<{
    hero: HeroSetting
    about: AboutSetting
    contacts: ContactsSetting
  }>
> {
  const { data, error } = await supabase.from('site_settings').select('*')

  if (error) return fail(error)

  const map = new Map<string, SiteSettingRow>()
  for (const row of (data ?? []) as SiteSettingRow[]) {
    map.set(row.key, row)
  }

  const hero = parseHero(map.get('hero')?.value)
  const about = parseAbout(map.get('about')?.value)
  const contacts = parseContacts(map.get('contacts')?.value)

  return ok({ hero, about, contacts })
}

export async function saveSiteSetting(
  key: string,
  value: Json,
): Promise<ApiResult<true>> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) return fail(error)
  return ok(true)
}

function parseHero(value: Json | undefined): HeroSetting {
  if (value === undefined || !isRecord(value)) return DEFAULT_HERO
  return {
    title: readString(value.title, DEFAULT_HERO.title),
    subtitle: readString(value.subtitle, DEFAULT_HERO.subtitle),
  }
}

function parseAbout(value: Json | undefined): AboutSetting {
  if (value === undefined || !isRecord(value)) return DEFAULT_ABOUT
  const paragraphs = readStringArray(value.paragraphs)
  return {
    title: readString(value.title, DEFAULT_ABOUT.title),
    paragraphs: paragraphs.length ? paragraphs : DEFAULT_ABOUT.paragraphs,
  }
}

function parseContacts(value: Json | undefined): ContactsSetting {
  if (value === undefined || !isRecord(value)) return DEFAULT_CONTACTS
  return {
    phone: readString(value.phone, DEFAULT_CONTACTS.phone),
    email: readString(value.email, DEFAULT_CONTACTS.email),
    address: readString(value.address, DEFAULT_CONTACTS.address),
  }
}

export {
  DEFAULT_HERO as DEFAULT_HERO_SETTING,
  DEFAULT_ABOUT as DEFAULT_ABOUT_SETTING,
  DEFAULT_CONTACTS as DEFAULT_CONTACTS_SETTING,
}
