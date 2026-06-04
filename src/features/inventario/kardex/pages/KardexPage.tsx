import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../../shared/components/Card'
import { PageHeader } from '../../../../shared/components/PageHeader'
import { can } from '../../../../shared/utils/permissions'
import { almacenService } from '../../../almacenes/services/almacenService'
import { ubicacionService } from '../../../almacenes/services/ubicacionService'
import { useAuth } from '../../../auth/context/useAuth'
import { productoService } from '../../../productos/services/productoService'
import type { TipoMovimiento } from '../../movimientos/types/movimiento.types'
import { KardexFilters } from '../components/KardexFilters'
import { KardexTable } from '../components/KardexTable'
import { getKardexApiErrorMessage, kardexService } from '../services/kardexService'

const PAGE_SIZE = 10

export function KardexPage() {
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [productoId, setProductoId] = useState<number | null>(null)
  const [almacenId, setAlmacenId] = useState<number | null>(null)
  const [ubicacionId, setUbicacionId] = useState<number | null>(null)
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento | ''>('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [page, setPage] = useState(0)
  const canView = can(user, 'KARDEX_VER')

  const filters = useMemo(
    () => ({
      almacenId,
      fechaDesde,
      fechaHasta,
      page,
      productoId,
      size: PAGE_SIZE,
      texto: texto.trim(),
      tipoMovimiento,
      ubicacionId,
    }),
    [almacenId, fechaDesde, fechaHasta, page, productoId, texto, tipoMovimiento, ubicacionId],
  )

  const kardexQuery = useQuery({
    enabled: canView,
    queryKey: ['kardex', filters],
    queryFn: () => kardexService.getKardex(filters),
  })

  const productosQuery = useQuery({
    enabled: canView,
    queryKey: ['productos-activos-kardex'],
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
    queryKey: ['almacenes-activos-kardex'],
    queryFn: almacenService.getAlmacenesActivos,
  })

  const ubicacionesQuery = useQuery({
    enabled: canView,
    queryKey: ['ubicaciones-activas-kardex'],
    queryFn: () =>
      ubicacionService.getUbicaciones({
        activo: true,
        page: 0,
        size: 500,
        texto: '',
      }),
  })

  const totalElements = kardexQuery.data?.totalElements ?? 0
  const totalPages = kardexQuery.data?.totalPages ?? 0
  const resetPage = () => setPage(0)

  if (!canView) {
    return (
      <div>
        <PageHeader title="Kardex" description="Consulta cronologica de movimientos valorizados." />
        <Card className="p-6">
          <p className="text-sm text-slate-600">No tiene permisos para consultar kardex.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader title="Kardex" description="Consulta cronologica de movimientos valorizados." />
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={kardexQuery.isFetching}
          onClick={() => kardexQuery.refetch()}
          type="button"
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </div>

      {kardexQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getKardexApiErrorMessage(kardexQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <KardexFilters
          almacenId={almacenId}
          almacenes={almacenesQuery.data ?? []}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onAlmacenChange={(value) => {
            setAlmacenId(value)
            setUbicacionId(null)
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
          onTextoChange={(value) => {
            setTexto(value)
            resetPage()
          }}
          onTipoMovimientoChange={(value) => {
            setTipoMovimiento(value)
            resetPage()
          }}
          onUbicacionChange={(value) => {
            setUbicacionId(value)
            resetPage()
          }}
          productoId={productoId}
          productos={productosQuery.data?.content ?? []}
          texto={texto}
          tipoMovimiento={tipoMovimiento}
          ubicacionId={ubicacionId}
          ubicaciones={ubicacionesQuery.data?.content ?? []}
        />
      </Card>

      <KardexTable isLoading={kardexQuery.isLoading} rows={kardexQuery.data?.content ?? []} />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} registro{totalElements === 1 ? '' : 's'} encontrado
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || kardexQuery.isFetching}
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
            disabled={page + 1 >= totalPages || kardexQuery.isFetching}
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
