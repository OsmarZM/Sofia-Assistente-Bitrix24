import { chunkText, chunkPages } from '@sofia/rag'
import type { Chunk } from '@sofia/rag'

export type ParseResult = {
  pages?: Array<{ text: string; pageIndex: number }>
  text?: string
  title?: string
}

// ── PDF ──────────────────────────────────────────────────────────────────────

export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // Dynamic import para compatibilidade ESM
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return {
    text: data.text,
    title: data.info?.Title as string | undefined,
  }
}

// ── DOCX ─────────────────────────────────────────────────────────────────────

export async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const mammoth = await import('mammoth')
  // Preserva headings como Markdown # para o chunker semântico
  const result = await mammoth.convertToMarkdown({ buffer })
  return { text: result.value }
}

// ── PPTX ─────────────────────────────────────────────────────────────────────

export async function parsePptx(buffer: Buffer): Promise<ParseResult> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  const pages: Array<{ text: string; pageIndex: number }> = []
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort()

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]!]!.async('text')
    // Remove tags XML e extrai texto
    const text = xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text.length > 20) {
      pages.push({ text, pageIndex: i + 1 })
    }
  }

  return { pages }
}

// ── URL / HTML ────────────────────────────────────────────────────────────────

export async function parseUrl(url: string): Promise<ParseResult> {
  const { fetch } = await import('undici')
  const { load } = await import('cheerio')
  const { Readability } = await import('@mozilla/readability')
  const { JSDOM } = await import('jsdom')

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Sofia-Knowledge-Bot/1.0' },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${url}`)
  }

  const html = await response.text()

  // Usa Readability para extrair conteúdo principal
  const dom = new JSDOM(html, { url })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  if (article?.textContent) {
    return { text: article.textContent, title: article.title }
  }

  // Fallback: cheerio remove scripts/styles e extrai body
  const $ = load(html)
  $('script, style, nav, footer, header').remove()
  const text = $('body').text().replace(/\s+/g, ' ').trim()
  const title = $('title').text().trim() || $('h1').first().text().trim()

  return { text, title }
}

// ── TXT / Markdown ────────────────────────────────────────────────────────────

export async function parseTxt(buffer: Buffer): Promise<ParseResult> {
  return { text: buffer.toString('utf8') }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export type SourceType = 'pdf' | 'docx' | 'pptx' | 'txt' | 'url' | 'csv'

export async function parseDocument(
  sourceType: SourceType,
  data: Buffer | string
): Promise<ParseResult> {
  switch (sourceType) {
    case 'pdf':
      return parsePdf(data as Buffer)
    case 'docx':
      return parseDocx(data as Buffer)
    case 'pptx':
      return parsePptx(data as Buffer)
    case 'url':
      return parseUrl(data as string)
    case 'txt':
    case 'csv':
      return parseTxt(data as Buffer)
    default:
      throw new Error(`Unsupported source type: ${sourceType as string}`)
  }
}

/** Parse + chunk em um único passo */
export async function parseAndChunk(
  sourceType: SourceType,
  data: Buffer | string,
  source: string
): Promise<Chunk[]> {
  const result = await parseDocument(sourceType, data)

  if (result.pages) {
    return chunkPages(result.pages, source)
  }

  return chunkText(result.text ?? '', { source })
}
