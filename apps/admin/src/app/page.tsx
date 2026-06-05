import { Sidebar } from '../components/layout/sidebar'
import { Topbar } from '../components/layout/topbar'
import { DashboardWidgets } from '../components/dashboard/dashboard-widgets'

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          <DashboardWidgets />
        </main>
      </div>
    </div>
  )
}
