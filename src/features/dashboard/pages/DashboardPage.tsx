import { useQuery } from '@tanstack/react-query'
import { AlertCircle, BarChart3, ClipboardList, Package, Warehouse } from 'lucide-react'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'

type InventorySummary = Record<string, unknown>

const getNumberValue = (summary: InventorySummary | undefined, keys: string[]) => {
  if (!summary) {
    return null
  }

  for (const key of keys) {
    const value = summary[key]

    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }

  return null
}

async function fetchInventorySummary() {
  const { data } = await apiClient.get('/api/reportes/inventario/resumen')
  return unwrapApiData<InventorySummary>(data)
}

export function DashboardPage() {
  const {
    data: summary,
    error,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: fetchInventorySummary,
  })

  const metrics = [
    {
      title: 'Productos',
      value: getNumberValue(summary, ['productos', 'totalProductos', 'cantidadProductos']),
      icon: Package,
    },
    {
      title: 'Stock',
      value: getNumberValue(summary, ['stock', 'stockTotal', 'unidadesStock']),
      icon: Warehouse,
    },
    {
      title: 'Movimientos',
      value: getNumberValue(summary, ['movimientos', 'totalMovimientos']),
      icon: ClipboardList,
    },
    {
      title: 'Reportes',
      value: getNumberValue(summary, ['reportes', 'totalReportes']),
      icon: BarChart3,
    },
  ]

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'No se pudo obtener el resumen del inventario.'

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vista inicial del estado operativo del almacen."
      />

      {isError ? (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">No se pudo cargar el resumen del backend.</p>
            <p className="mt-1">
              Verifique que Spring Boot este activo en http://localhost:8080 y que CORS permita
              solicitudes desde Vite. Detalle: {errorMessage}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card className="p-5" key={metric.title}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">
                    {isLoading ? '...' : metric.value ?? '--'}
                  </p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-md bg-slate-100 text-slate-700">
                  <Icon size={24} />
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-slate-950">Base del ERP</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          La navegacion, autenticacion, persistencia de sesion y rutas protegidas ya estan
          listas para incorporar los modulos funcionales de productos, inventario, reportes y
          administracion.
        </p>
      </Card>
    </div>
  )
}
