/**
 * Circuit breaker in-memory para providers de IA.
 * Estado persiste em memória do processo; sincroniza com DB via router.
 */

const FAILURE_THRESHOLD = 5
const OPEN_DURATION_MS = 5 * 60 * 1000 // 5 minutos
const RESET_WINDOW_MS = 60 * 1000 // 1 minuto

type State = 'closed' | 'open' | 'half-open'

type CircuitState = {
  state: State
  failures: number
  lastFailure: number | null
  openUntil: number | null
}

const circuits = new Map<string, CircuitState>()

export function getCircuitState(providerId: string): CircuitState {
  return (
    circuits.get(providerId) ?? {
      state: 'closed',
      failures: 0,
      lastFailure: null,
      openUntil: null,
    }
  )
}

export function recordSuccess(providerId: string): void {
  circuits.set(providerId, {
    state: 'closed',
    failures: 0,
    lastFailure: null,
    openUntil: null,
  })
}

export function recordFailure(providerId: string): CircuitState {
  const current = getCircuitState(providerId)
  const now = Date.now()

  // Reseta contagem se última falha foi fora da janela
  const failures =
    current.lastFailure && now - current.lastFailure > RESET_WINDOW_MS
      ? 1
      : current.failures + 1

  const newState: CircuitState =
    failures >= FAILURE_THRESHOLD
      ? { state: 'open', failures, lastFailure: now, openUntil: now + OPEN_DURATION_MS }
      : { state: 'closed', failures, lastFailure: now, openUntil: null }

  circuits.set(providerId, newState)
  return newState
}

export function isCircuitOpen(providerId: string): boolean {
  const state = getCircuitState(providerId)
  if (state.state !== 'open') return false

  if (state.openUntil && Date.now() > state.openUntil) {
    // Transição para half-open — permite uma tentativa
    circuits.set(providerId, { ...state, state: 'half-open' })
    return false
  }

  return true
}

export function getAllCircuitStates(): Map<string, CircuitState> {
  return new Map(circuits)
}
