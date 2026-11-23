const MAX_WORKBOOK_BYTES = 5 * 1024 * 1024

export async function readXlsxRows(file: File): Promise<string[][]> {
  if (
    !/\.xlsx$/i.test(file.name) ||
    file.size === 0 ||
    file.size > MAX_WORKBOOK_BYTES
  ) {
    throw new Error('Выберите непустой файл .xlsx размером до 5 МБ.')
  }

  try {
    const { readSheet } = await import('read-excel-file/browser')
    const rows = await readSheet(file, 1)
    return rows.map((row) =>
      row.map((value) => (value == null ? '' : String(value).trim())),
    )
  } catch {
    throw new Error(
      'Не удалось открыть книгу Excel. Проверьте формат файла .xlsx.',
    )
  }
}
