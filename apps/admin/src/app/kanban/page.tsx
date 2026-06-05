import { Sidebar } from '../../components/layout/sidebar'
import { Topbar } from '../../components/layout/topbar'
import { KanbanBoard } from '../../components/kanban/kanban-board'
import { apiClient } from '../../lib/api'

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
  let sessions = []
  let phases = []
  try {
    ;[sessions, phases] = await Promise.all([
      apiClient.sessions.list({ open: true }),
      fetch(`${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'}/admin/phases`).then(
        (r) => (r.ok ? r.json() : [])
      ),
    ])
  } catch { /* dev: API may not be running */ }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title="Conversas" alertCount={0} />
        <main className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <KanbanBoard initialSessions={sessions} phases={phases} />
        </main>
      </div>
    </div>
  )
}
