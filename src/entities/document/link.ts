export function safeDocumentLink(value: string | null): string | null {
  if (!value) return null
  const href = value.trim()
  if (/^\/(?![\\/])/.test(href)) return href

  try {
    const url = new URL(href)
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}
