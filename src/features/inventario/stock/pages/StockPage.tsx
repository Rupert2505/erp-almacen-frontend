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
import { StockBajoMinimoTable } from '../components/StockBajoMinimoTable'
import { StockFilters } from '../components/StockFilters'
import { StockTable } from '../components/StockTable'
import { getStockApiErrorMessage, stockService } from '../services/stockService'

const PAGE_SIZE = 10

type StockMode = 'actual' | 'bajo-minimo'

export function StockPage() {
  const { user } = useAuth()
  const [mode, setMode] = useState<StockMode>('actual')
  const [texto, setTexto] = useState('')
  const [productoId, setProductoId] = useState<number | null>(null)
  const [almacenId, setAlmacenId] = useState<number | null>(null)
  const [ubicacionId, setUbicacionId] = useState<number | null>(null)
  const [soloConStock, setSoloConStock] = useState(false)
  const [page, setPage] = useState(0)
  const canView = can(user, 'STOCK_VER')

  const filters = useMemo(
    () => ({
      almacenId,
      bajoMinimo: mode === 'bajo-minimo',
      page,
      productoId,
      size: PAGE_SIZE,
      soloConStock,
      texto: texto.trim(),
      ubicacionId,
    }),
    [almacenId, mode, page, productoId, soloConStock, texto, ubicacionId],
  )

  const stockQuery = useQuery({
    enabled: canView && mode === 'actual',
    queryKey: ['stock-actual', filters],
    queryFn: () => stockService.getStock(filters),
  })

  const bajoMinimoQuery = useQuery({
    enabled: canView && mode === 'bajo-minimo',
    queryKey: ['stock-bajo-minimo', filters],
    queryFn: () => stockService.getStockBajoMinimo(filters),
  })

  const productosQuery = useQuery({
    enabled: canView,
    queryKey: ['productos-activos-stock'],
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
    queryKey: ['almacenes-activos-stock'],
    queryFn: almacenService.getAlmacenesActivos,
  })

  const ubicacionesQuery = useQuery({
    enabled: canView,
    queryKey: ['ubicaciones-activas-stock'],
    queryFn: () =>
      ubicacionService.getUbicaciones({
        activo: true,
        page: 0,
        size: 500,
        texto: '',
      }),
  })

  const activeQuery = mode === 'actual' ? stockQuery : bajoMinimoQuery
  const totalElements = activeQuery.data?.totalElements ?? 0
  const totalPages = activeQuery.data?.totalPages ?? 0

  const resetPage = () => setPage(0)

  const handleRefresh = async () => {
    await activeQuery.refetch()
  }

  if (!canView) {
    return (
      <div>
        <PageHeader title="Stock actual" description="Consulta de existencias por producto y almacen." />
        <Card className="p-6">
          <p className="text-sm text-slate-600">No tiene permisos para consultar stock.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader title="Stock actual" description="Consulta de existencias por producto y almacen." />
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={activeQuery.isFetching}
          onClick={handleRefresh}
          type="button"
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </div>

      {activeQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getStockApiErrorMessage(activeQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            className={`inline-flex h-9 items-center rounded-md px-4 text-sm font-semibold ${
              mode === 'actual'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => {
              setMode('actual')
              setPage(0)
            }}
            type="button"
          >
            Stock actual
          </button>
          <button
            className={`inline-flex h-9 items-center rounded-md px-4 text-sm font-semibold ${
              mode === 'bajo-minimo'
                ? 'bg-amber-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => {
              setMode('bajo-minimo')
              setPage(0)
            }}
            type="button"
          >
            Bajo minimo
          </button>
        </div>

        <StockFilters
          almacenId={almacenId}
          almacenes={almacenesQuery.data ?? []}
          onAlmacenChange={(value) => {
            setAlmacenId(value)
            setUbicacionId(null)
            resetPage()
          }}
          onProductoChange={(value) => {
            setProductoId(value)
            resetPage()
          }}
          onSoloConStockChange={(value) => {
            setSoloConStock(value)
            resetPage()
          }}
          onTextoChange={(value) => {
            setTexto(value)
            resetPage()
          }}
          onUbicacionChange={(value) => {
            setUbicacionId(value)
            resetPage()
          }}
          productoId={productoId}
          productos={productosQuery.data?.content ?? []}
          soloConStock={soloConStock}
          texto={texto}
          ubicacionId={ubicacionId}
          ubicaciones={ubicacionesQuery.data?.content ?? []}
        />
      </Card>

      {mode === 'actual' ? (
        <StockTable isLoading={stockQuery.isLoading} rows={stockQuery.data?.content ?? []} />
      ) : (
        <StockBajoMinimoTable
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
