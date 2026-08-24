import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Package, ScrollText, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { can } from '../../../shared/utils/permissions'
import { useAuth } from '../../auth/context/useAuth'
import { ResumenInventarioCards } from '../../reportes/inventario/components/ResumenInventarioCards'
import {
  getReporteInventarioApiErrorMessage,
  reporteInventarioService,
} from '../../reportes/inventario/services/reporteInventarioService'

const shortcuts = [
  {
    title: 'Productos',
    description: 'Catalogo de productos, familias, marcas y tipos de articulo.',
    to: '/productos',
    icon: Package,
    tone: 'bg-cyan-50 text-cyan-700',
  },
  {
    title: 'Movimientos',
    description: 'Entradas, salidas, ajustes, transferencias y devoluciones.',
    to: '/inventario/movimientos',
    icon: ClipboardList,
    tone: 'bg-indigo-50 text-indigo-700',
  },
  {
    title: 'Stock',
    description: 'Consulta de existencias por producto, almacen y ubicacion.',
    to: '/inventario/stock',
    icon: Warehouse,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Reportes',
    description: 'Informes de inventario, valorizacion, entradas y salidas.',
    to: '/reportes/inventario',
    icon: ScrollText,
    tone: 'bg-amber-50 text-amber-700',
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const canViewReports = can(user, 'REPORTE_VER')
  const resumenQuery = useQuery({
    enabled: canViewReports,
    queryKey: ['reportes', 'inventario', 'resumen'],
    queryFn: reporteInventarioService.getResumen,
  })

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vista principal de accesos operativos y resumen general del ERP Almacen."
      />

      {resumenQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getReporteInventarioApiErrorMessage(resumenQuery.error)}
        </div>
      ) : null}

      {canViewReports ? (
        <div className="mb-6">
          <ResumenInventarioCards
            isLoading={resumenQuery.isLoading}
            resumen={resumenQuery.data}
          />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map((item) => {
          const Icon = item.icon

          return (
            <Link key={item.to} to={item.to}>
              <Card className="h-full p-5 transition hover:border-cyan-200 hover:bg-cyan-50/30 hover:shadow-md">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${item.tone}`}>
                  <Icon size={22} />
                </span>
                <h2 className="mt-4 text-base font-bold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
