import { Sidebar } from '../../components/layout/sidebar'
import { Topbar } from '../../components/layout/topbar'

export default function KnowledgePage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title="Base de Conhecimento" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
            Gestão de documentos em breve
          </div>
        </main>
      </div>
    </div>
  )
}
