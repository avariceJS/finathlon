// src/entities/question-bank/excel/xlsx-reader.ts

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  const copy = new Uint8Array(compressed.byteLength)
  copy.set(compressed)
  void writer.write(copy)
  void writer.close()
  const buf = await new Response(ds.readable).arrayBuffer()
  return new Uint8Array(buf)
}

async function unzipXlsxEntries(
  buffer: ArrayBuffer,
): Promise<Map<string, string>> {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('utf-8')
  const entries = new Map<string, string>()

  let eocdOffset = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Файл не является корректным архивом .xlsx')
  }

  const cdCount = view.getUint16(eocdOffset + 10, true)
  let cdOffset = view.getUint32(eocdOffset + 16, true)

  for (let i = 0; i < cdCount; i++) {
    if (view.getUint32(cdOffset, true) !== 0x02014b50) break
    const method = view.getUint16(cdOffset + 10, true)
    const compSize = view.getUint32(cdOffset + 20, true)
    const nameLen = view.getUint16(cdOffset + 28, true)
    const extraLen = view.getUint16(cdOffset + 30, true)
    const commentLen = view.getUint16(cdOffset + 32, true)
    const localHeaderOffset = view.getUint32(cdOffset + 42, true)
    const fileName = decoder.decode(
      bytes.slice(cdOffset + 46, cdOffset + 46 + nameLen),
    )
    cdOffset += 46 + nameLen + extraLen + commentLen

    if (!fileName.endsWith('.xml') && !fileName.endsWith('.rels')) continue

    const localNameLen = view.getUint16(localHeaderOffset + 26, true)
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const rawData = bytes.slice(dataStart, dataStart + compSize)

    let contentBytes: Uint8Array
    if (method === 0) {
      contentBytes = rawData
    } else if (method === 8) {
      contentBytes = await inflateRaw(rawData)
    } else {
      continue
    }
    entries.set(fileName, decoder.decode(contentBytes))
  }

  return entries
}

function colRefToIndex(ref: string): number {
  const letters = ref.replace(/[0-9]/g, '').toUpperCase()
  let idx = 0
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64)
  }
  return idx - 1
}

function extractRowsFromXml(entries: Map<string, string>): string[][] {
  const parser = new DOMParser()
  const sharedStrings: string[] = []

  const sstXml = entries.get('xl/sharedStrings.xml')
  if (sstXml) {
    const sstDoc = parser.parseFromString(sstXml, 'application/xml')
    const siNodes = Array.from(sstDoc.getElementsByTagName('si'))
    for (const si of siNodes) {
      const tNodes = Array.from(si.getElementsByTagName('t'))
      sharedStrings.push(tNodes.map((n) => n.textContent ?? '').join(''))
    }
  }

  const sheetKey =
    Array.from(entries.keys())
      .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
      .sort()
      .at(0) ?? ''

  const sheetXml = entries.get(sheetKey)
  if (!sheetXml) {
    throw new Error('В файле .xlsx не найден рабочий лист с вопросами')
  }

  const sheetDoc = parser.parseFromString(sheetXml, 'application/xml')
  const rowNodes = Array.from(sheetDoc.getElementsByTagName('row'))
  const rows: string[][] = []

  for (const rowNode of rowNodes) {
    const cells = Array.from(rowNode.getElementsByTagName('c'))
    const rowValues: string[] = []

    for (const cell of cells) {
      const ref = cell.getAttribute('r') ?? ''
      const colIdx = ref ? colRefToIndex(ref) : rowValues.length
      const type = cell.getAttribute('t')

      let value = ''
      if (type === 's') {
        const vText = cell.getElementsByTagName('v').item(0)?.textContent ?? ''
        const ssIdx = Number(vText)
        value = Number.isInteger(ssIdx) ? (sharedStrings.at(ssIdx) ?? '') : ''
      } else if (type === 'inlineStr') {
        const tNodes = Array.from(cell.getElementsByTagName('t'))
        value = tNodes.map((n) => n.textContent ?? '').join('')
      } else {
        value = cell.getElementsByTagName('v').item(0)?.textContent ?? ''
      }

      while (rowValues.length < colIdx) {
        rowValues.push('')
      }
      rowValues[colIdx] = value.trim()
    }

    if (rowValues.some((v) => v !== '')) {
      rows.push(rowValues)
    }
  }

  return rows
}

export async function readXlsxRows(file: File): Promise<string[][]> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    throw new Error('Допускаются только файлы в формате .xlsx')
  }

  const buffer = await file.arrayBuffer()
  const entries = await unzipXlsxEntries(buffer)
  return extractRowsFromXml(entries)
}