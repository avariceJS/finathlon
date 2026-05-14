import { supabase } from '@/shared/supabase'
import type { NewsArticle, NewsArticleInput } from '@/entities/news'
import type { NewsRow } from '@/shared/supabase'

import { fail, ok, type ApiResult } from './utils'

function mapNews(row: NewsRow): NewsArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? '',
    content: row.content ?? '',
    coverUrl: row.cover_url,
    authorName: row.author_name,
    publishedAt: row.published_at,
    isPublished: row.is_published,
  }
}

export async function listNews(
  options: { includeUnpublished?: boolean; limit?: number } = {},
): Promise<ApiResult<NewsArticle[]>> {
  let query = supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })

  if (!options.includeUnpublished) {
    query = query.eq('is_published', true)
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) return fail(error)
  return ok((data ?? []).map(mapNews))
}

export async function getNewsBySlug(
  slug: string,
): Promise<ApiResult<NewsArticle | null>> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return fail(error)
  return ok(data ? mapNews(data) : null)
}

export async function createNews(
  input: NewsArticleInput,
): Promise<ApiResult<NewsArticle>> {
  const payload = {
    slug: input.slug,
    title: input.title,
    summary: input.summary ?? null,
    content: input.content ?? null,
    cover_url: input.coverUrl ?? null,
    author_name: input.authorName ?? null,
    is_published: input.isPublished ?? true,
    published_at: input.publishedAt ?? new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('news')
    .insert(payload)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapNews(data))
}

export async function updateNews(
  id: string,
  input: Partial<NewsArticleInput>,
): Promise<ApiResult<NewsArticle>> {
  const payload: Partial<NewsRow> = {}
  if (input.slug !== undefined) payload.slug = input.slug
  if (input.title !== undefined) payload.title = input.title
  if (input.summary !== undefined) payload.summary = input.summary
  if (input.content !== undefined) payload.content = input.content
  if (input.coverUrl !== undefined) payload.cover_url = input.coverUrl
  if (input.authorName !== undefined) payload.author_name = input.authorName
  if (input.isPublished !== undefined) payload.is_published = input.isPublished
  if (input.publishedAt !== undefined) payload.published_at = input.publishedAt

  const { data, error } = await supabase
    .from('news')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return fail(error)
  return ok(mapNews(data))
}

export async function deleteNews(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('news').delete().eq('id', id)
  if (error) return fail(error)
  return ok(true)
}
