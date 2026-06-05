/**
 * Chunker híbrido:
 * 1. Corte semântico por heading/seção (H1-H3, CAPS, separadores)
 * 2. Sliding window por tokens como fallback para seções grandes
 * 3. Merge de seções pequenas para evitar chunks inúteis
 */

export type Chunk = {
  content: string
  metadata: {
    section?: string
    pageIndex?: number
    slideIndex?: number
    chunkIndex: number
    tokenCount: number
    source?: string
  }
}

const TARGET_TOKENS = 500
const OVERLAP_TOKENS = 80
const MIN_TOKENS = 150

/** Estimativa rápida de tokens (1 token ≈ 4 chars em pt-BR) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function slidingWindowChunk(
  text: string,
  startIndex: number,
  section: string | undefined,
  pageIndex: number | undefined
): Chunk[] {
  const words = text.split(/\s+/).filter(Boolean)
  const targetWords = TARGET_TOKENS
  const overlapWords = OVERLAP_TOKENS
  const chunks: Chunk[] = []
  let i = 0
  let chunkIndex = startIndex

  while (i < words.length) {
    const slice = words.slice(i, i + targetWords).join(' ')
    if (slice.trim().length > 0) {
      chunks.push({
        content: slice,
        metadata: { chunkIndex: chunkIndex++, tokenCount: estimateTokens(slice), section, pageIndex },
      })
    }
    i += targetWords - overlapWords
    if (i + overlapWords >= words.length) break
  }

  // Última fatia residual
  const remainder = words.slice(i).join(' ')
  if (remainder.trim().length > 0 && estimateTokens(remainder) >= MIN_TOKENS / 2) {
    chunks.push({
      content: remainder,
      metadata: { chunkIndex: chunkIndex++, tokenCount: estimateTokens(remainder), section, pageIndex },
    })
  }

  return chunks
}

function extractSections(text: string): Array<{ heading: string | null; content: string }> {
  // Reconhece: # Heading, ## Sub, ### Sub, TÍTULO EM CAPS, ─── separadores
  const headingPattern =
    /^(#{1,3}\s+.+|[A-ZÀ-Ü][A-ZÀ-Ü\s]{3,}[A-ZÀ-Ü]|[-─═]{4,})\s*$/gm

  const sections: Array<{ heading: string | null; content: string }> = []
  let lastIndex = 0
  let lastHeading: string | null = null
  let match: RegExpExecArray | null

  while ((match = headingPattern.exec(text)) !== null) {
    const contentBefore = text.slice(lastIndex, match.index).trim()
    if (contentBefore.length > 0) {
      sections.push({ heading: lastHeading, content: contentBefore })
    }
    lastHeading = match[0].trim().replace(/^#+\s*/, '')
    lastIndex = match.index + match[0].length
  }

  const remaining = text.slice(lastIndex).trim()
  if (remaining.length > 0) {
    sections.push({ heading: lastHeading, content: remaining })
  }

  return sections.filter((s) => s.content.length > 0)
}

export type ChunkOptions = {
  source?: string
  pageIndex?: number
  slideIndex?: number
}

export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  if (!text.trim()) return []

  const sections = extractSections(text)
  const chunks: Chunk[] = []
  let chunkIndex = 0

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!
    const tokens = estimateTokens(section.content)

    // Seção muito pequena — tentar mesclar com a anterior
    if (tokens < MIN_TOKENS) {
      const prev = chunks[chunks.length - 1]
      if (prev) {
        prev.content += '\n\n' + section.content
        prev.metadata.tokenCount = estimateTokens(prev.content)
        continue
      }
    }

    if (tokens <= TARGET_TOKENS) {
      chunks.push({
        content: section.content,
        metadata: {
          section: section.heading ?? undefined,
          pageIndex: options.pageIndex,
          slideIndex: options.slideIndex,
          chunkIndex: chunkIndex++,
          tokenCount: tokens,
          source: options.source,
        },
      })
    } else {
      // Seção grande → sliding window
      const sub = slidingWindowChunk(
        section.content,
        chunkIndex,
        section.heading ?? undefined,
        options.pageIndex
      )
      sub.forEach((c) => {
        c.metadata.slideIndex = options.slideIndex
        c.metadata.source = options.source
      })
      chunks.push(...sub)
      chunkIndex += sub.length
    }
  }

  return chunks
}

/** Chunka múltiplas páginas/slides (ex: PDF com paginação) */
export function chunkPages(
  pages: Array<{ text: string; pageIndex: number }>,
  source?: string
): Chunk[] {
  return pages.flatMap((p) => chunkText(p.text, { pageIndex: p.pageIndex, source }))
}
