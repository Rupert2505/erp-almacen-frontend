import {
  Archive,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  PackageCheck,
  PackageSearch,
  Warehouse,
  XCircle,
} from 'lucide-react'
import type { ReporteInventarioResumen } from '../types/reporteInventario.types'
import { formatReportCount, formatReportDecimal } from '../utils/reportNumberFormat'

type ResumenInventarioCardsProps = {
  resumen?: ReporteInventarioResumen
  isLoading: boolean
}

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatValue(value?: number, currency = false, decimal = false) {
  if (value === undefined || value === null) {
    return isNaN(Number(value)) ? '-' : '0'
  }

  if (currency) {
    return currencyFormatter.format(value)
  }

  return decimal ? formatReportDecimal(value) : formatReportCount(value)
}

export function ResumenInventarioCards({ isLoading, resumen }: ResumenInventarioCardsProps) {
  const cards = [
    {
      label: 'Total productos',
      value: resumen?.totalProductos,
      icon: PackageSearch,
      tone: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Productos activos',
      value: resumen?.productosActivos,
      icon: PackageCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Total almacenes',
      value: resumen?.totalAlmacenes,
      icon: Warehouse,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Total movimientos',
      value: resumen?.totalMovimientos,
      icon: ClipboardList,
      tone: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Mov. confirmados',
      value: resumen?.movimientosConfirmados,
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Mov. borrador',
      value: resumen?.movimientosBorrador,
      icon: Archive,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Mov. anulados',
      value: resumen?.movimientosAnulados,
      icon: XCircle,
      tone: 'bg-red-50 text-red-700',
    },
    {
      label: 'Total stock actual',
      value: resumen?.totalStockActual,
      icon: Boxes,
      tone: 'bg-cyan-50 text-cyan-700',
      decimal: true,
    },
    {
      label: 'Productos bajo minimo',
      value: resumen?.productosBajoMinimo,
      icon: FileWarning,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Valor inventario estimado',
      value: resumen?.valorInventarioEstimado,
      icon: Boxes,
      tone: 'bg-slate-900 text-white',
      currency: true,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            key={card.label}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${card.tone}`}
              >
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-950">
              {isLoading ? '...' : formatValue(card.value, card.currency, card.decimal)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
