import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../../shared/components/Card'
import { PageHeader } from '../../../../shared/components/PageHeader'
import { can } from '../../../../shared/utils/permissions'
import { almacenService } from '../../../almacenes/services/almacenService'
import { useAuth } from '../../../auth/context/useAuth'
import { TIPOS_MOVIMIENTO } from '../../../inventario/movimientos/types/movimiento.types'
import type {
  EstadoMovimiento,
  TipoMovimiento,
} from '../../../inventario/movimientos/types/movimiento.types'
import { productoService } from '../../../productos/services/productoService'
import { proveedorService } from '../../../proveedores/services/proveedorService'
import { EntradasProveedorTable } from '../components/EntradasProveedorTable'
import { ProductosBajoMinimoTable } from '../components/ProductosBajoMinimoTable'
import { ReporteInventarioFilters } from '../components/ReporteInventarioFilters'
import { ReporteMovimientosTable } from '../components/ReporteMovimientosTable'
import { ResumenInventarioCards } from '../components/ResumenInventarioCards'
import { SalidasInventarioTable } from '../components/SalidasInventarioTable'
import { StockValorizadoTable } from '../components/StockValorizadoTable'
import {
  getReporteInventarioApiErrorMessage,
  reporteInventarioService,
} from '../services/reporteInventarioService'
import type { ReporteInventarioTipo } from '../types/reporteInventario.types'

const PAGE_SIZE = 10

const reportes: Array<{ value: ReporteInventarioTipo; label: string }> = [
  { value: 'movimientos', label: 'Movimientos' },
  { value: 'stock-valorizado', label: 'Stock valorizado' },
  { value: 'entradas-proveedor', label: 'Entradas por proveedor' },
  { value: 'salidas', label: 'Salidas' },
  { value: 'productos-bajo-minimo', label: 'Bajo minimo' },
]

function defaultTipoForReporte(reporte: ReporteInventarioTipo, current: TipoMovimiento | '') {
  if (reporte !== 'salidas') {
    return current
  }

  return TIPOS_MOVIMIENTO.includes(current as TipoMovimiento) ? current : ''
}

export function ReportesInventarioPage() {
  const { user } = useAuth()
  const [reporte, setReporte] = useState<ReporteInventarioTipo>('movimientos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [productoId, setProductoId] = useState<number | null>(null)
  const [almacenId, setAlmacenId] = useState<number | null>(null)
  const [proveedorId, setProveedorId] = useState<number | null>(null)
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento | ''>('')
  const [estado, setEstado] = useState<EstadoMovimiento | ''>('')
  const [soloConStock, setSoloConStock] = useState(false)
  const [page, setPage] = useState(0)
  const canView = can(user, 'REPORTE_VER')

  const filters = useMemo(
    () => ({
      almacenId,
      estado: reporte === 'movimientos' ? estado : '',
      fechaDesde,
      fechaHasta,
      page,
      productoId,
      proveedorId,
      size: PAGE_SIZE,
      soloConStock,
      tipoMovimiento: defaultTipoForReporte(reporte, tipoMovimiento),
    }),
    [
      almacenId,
      estado,
      fechaDesde,
      fechaHasta,
      page,
      productoId,
      proveedorId,
      reporte,
      soloConStock,
      tipoMovimiento,
    ],
  )

  const resumenQuery = useQuery({
    enabled: canView,
    queryKey: ['reporte-inventario-resumen'],
    queryFn: reporteInventarioService.getResumen,
  })

  const movimientosQuery = useQuery({
    enabled: canView && reporte === 'movimientos',
    queryKey: ['reporte-inventario-movimientos', filters],
    queryFn: () => reporteInventarioService.getMovimientos(filters),
  })

  const stockValorizadoQuery = useQuery({
    enabled: canView && reporte === 'stock-valorizado',
    queryKey: ['reporte-inventario-stock-valorizado', filters],
    queryFn: () => reporteInventarioService.getStockValorizado(filters),
  })

  const entradasProveedorQuery = useQuery({
    enabled: canView && reporte === 'entradas-proveedor',
    queryKey: ['reporte-inventario-entradas-proveedor', filters],
    queryFn: () => reporteInventarioService.getEntradasProveedor(filters),
  })

  const salidasQuery = useQuery({
    enabled: canView && reporte === 'salidas',
    queryKey: ['reporte-inventario-salidas', filters],
    queryFn: () => reporteInventarioService.getSalidas(filters),
  })

  const bajoMinimoQuery = useQuery({
    enabled: canView && reporte === 'productos-bajo-minimo',
    queryKey: ['reporte-inventario-productos-bajo-minimo', filters],
    queryFn: () => reporteInventarioService.getProductosBajoMinimo(filters),
  })

  const productosQuery = useQuery({
    enabled: canView,
    queryKey: ['productos-activos-reportes-inventario'],
    queryFn: () =>
      productoService.getProductos({
        activo: true,
        page: 0,
        size: 300,
        texto: '',
      }),
  })

  const almacenesQuery = useQuery({
    enabled: canView,
    queryKey: ['almacenes-activos-reportes-inventario'],
    queryFn: almacenService.getAlmacenesActivos,
  })

  const proveedoresQuery = useQuery({
    enabled: canView,
    queryKey: ['proveedores-activos-reportes-inventario'],
    queryFn: () =>
      proveedorService.getProveedores({
        activo: true,
        page: 0,
        size: 300,
        texto: '',
      }),
  })

  const activeQuery =
    reporte === 'movimientos'
      ? movimientosQuery
      : reporte === 'stock-valorizado'
        ? stockValorizadoQuery
        : reporte === 'entradas-proveedor'
          ? entradasProveedorQuery
          : reporte === 'salidas'
            ? salidasQuery
            : bajoMinimoQuery

  const totalElements = activeQuery.data?.totalElements ?? 0
  const totalPages = activeQuery.data?.totalPages ?? 0

  const resetPage = () => setPage(0)

  const handleReporteChange = (value: ReporteInventarioTipo) => {
    setReporte(value)
    setPage(0)
  }

  const handleRefresh = async () => {
    await Promise.all([resumenQuery.refetch(), activeQuery.refetch()])
  }

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Reportes de inventario"
          description="Consultas consolidadas de movimientos, stock y valorizacion."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para consultar reportes de inventario.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Reportes de inventario"
          description="Consultas consolidadas de movimientos, stock y valorizacion."
        />
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={activeQuery.isFetching || resumenQuery.isFetching}
          onClick={handleRefresh}
          type="button"
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </div>

      {resumenQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getReporteInventarioApiErrorMessage(resumenQuery.error)}
        </div>
      ) : null}

      <div className="mb-6">
        <ResumenInventarioCards
          isLoading={resumenQuery.isLoading}
          resumen={resumenQuery.data}
        />
      </div>

      {activeQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getReporteInventarioApiErrorMessage(activeQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <div className="mb-5 flex flex-wrap gap-2">
          {reportes.map((item) => (
            <button
              className={`inline-flex h-9 items-center rounded-md px-4 text-sm font-semibold ${
                reporte === item.value
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              key={item.value}
              onClick={() => handleReporteChange(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <ReporteInventarioFilters
          almacenId={almacenId}
          almacenes={almacenesQuery.data ?? []}
          estado={estado}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onAlmacenChange={(value) => {
            setAlmacenId(value)
            resetPage()
          }}
          onEstadoChange={(value) => {
            setEstado(value)
            resetPage()
          }}
          onFechaDesdeChange={(value) => {
            setFechaDesde(value)
            resetPage()
          }}
          onFechaHastaChange={(value) => {
            setFechaHasta(value)
            resetPage()
          }}
          onProductoChange={(value) => {
            setProductoId(value)
            resetPage()
          }}
          onProveedorChange={(value) => {
            setProveedorId(value)
            resetPage()
          }}
          onSoloConStockChange={(value) => {
            setSoloConStock(value)
            resetPage()
          }}
          onTipoMovimientoChange={(value) => {
            setTipoMovimiento(value)
            resetPage()
          }}
          productoId={productoId}
          productos={productosQuery.data?.content ?? []}
          proveedorId={proveedorId}
          proveedores={proveedoresQuery.data?.content ?? []}
          reporte={reporte}
          soloConStock={soloConStock}
          tipoMovimiento={tipoMovimiento}
        />
      </Card>

      {reporte === 'movimientos' ? (
        <ReporteMovimientosTable
          isLoading={movimientosQuery.isLoading}
          rows={movimientosQuery.data?.content ?? []}
        />
      ) : reporte === 'stock-valorizado' ? (
        <StockValorizadoTable
          isLoading={stockValorizadoQuery.isLoading}
          rows={stockValorizadoQuery.data?.content ?? []}
        />
      ) : reporte === 'entradas-proveedor' ? (
        <EntradasProveedorTable
          isLoading={entradasProveedorQuery.isLoading}
          rows={entradasProveedorQuery.data?.content ?? []}
        />
      ) : reporte === 'salidas' ? (
        <SalidasInventarioTable
          isLoading={salidasQuery.isLoading}
          rows={salidasQuery.data?.content ?? []}
        />
      ) : (
        <ProductosBajoMinimoTable
          isLoading={bajoMinimoQuery.isLoading}
          rows={bajoMinimoQuery.data?.content ?? []}
        />
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} registro{totalElements === 1 ? '' : 's'} encontrado
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || activeQuery.isFetching}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
            type="button"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <span className="min-w-28 text-center">
            Pagina {totalPages === 0 ? 0 : page + 1} de {totalPages}
          </span>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page + 1 >= totalPages || activeQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
