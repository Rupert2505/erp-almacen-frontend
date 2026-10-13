import { useQuery } from '@tanstack/react-query'
import { Download, FileText, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import logoBallena from '../../../../assets/images/logo_ballena_02.png'
import { Card } from '../../../../shared/components/Card'
import { PageHeader } from '../../../../shared/components/PageHeader'
import { downloadExcel, filenameFromDisposition } from '../../../../shared/utils/downloads'
import { downloadPdfReport } from '../../../../shared/utils/pdfReport'
import { can } from '../../../../shared/utils/permissions'
import { almacenService } from '../../../almacenes/services/almacenService'
import { ubicacionService } from '../../../almacenes/services/ubicacionService'
import { useAuth } from '../../../auth/context/useAuth'
import { familiaService } from '../../../familias/services/familiaService'
import {
  TIPOS_MOVIMIENTO,
  type EstadoMovimiento,
  type TipoMovimiento,
} from '../../../inventario/movimientos/types/movimiento.types'
import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import { marcaService } from '../../../marcas/services/marcaService'
import { productoService } from '../../../productos/services/productoService'
import type { Producto } from '../../../productos/types/producto.types'
import { proveedorService } from '../../../proveedores/services/proveedorService'
import { subfamiliaService } from '../../../subfamilias/services/subfamiliaService'
import { tipoArticuloService } from '../../../tipos-articulo/services/tipoArticuloService'
import { EntradasProveedorTable } from '../components/EntradasProveedorTable'
import { KardexValorizadoTable } from '../components/KardexValorizadoTable'
import { ReporteInventarioFilters } from '../components/ReporteInventarioFilters'
import { ReporteMovimientosTable } from '../components/ReporteMovimientosTable'
import { ProductosBajoMinimoTable } from '../components/ProductosBajoMinimoTable'
import { ResumenInventarioCards } from '../components/ResumenInventarioCards'
import { SalidasInventarioTable } from '../components/SalidasInventarioTable'
import { SalidasPorOsTable } from '../components/SalidasPorOsTable'
import { StockValorizadoTable } from '../components/StockValorizadoTable'
import {
  getReporteInventarioApiErrorMessage,
  reporteInventarioService,
} from '../services/reporteInventarioService'
import { buildEntradasProveedorPdfTable } from '../utils/entradasProveedorPdf'
import {
  buildEntradasProveedorPdfSummary,
  buildKardexPdfSummary,
  buildSalidasPdfSummary,
} from '../utils/inventoryPdfSummaries'
import { buildBajoMinimoPdfRow, buildKardexPdfRow, buildSalidaPdfRow } from '../utils/inventoryPdfRows'
import { getCurrentMonthDateRange, reportUsesDateRange } from '../utils/reportDateRange'
import { buildMovimientoPdfRow } from '../utils/movimientoPdfRow'
import { formatReportDecimal } from '../utils/reportNumberFormat'
import { fetchAllReportRows } from '../utils/reportPagination'
import { buildSalidasPorOsPdfTable } from '../utils/salidasPorOsPdf'
import { buildStockValorizadoPdfSummary } from '../utils/stockValorizadoPdfSummary'
import type {
  EntradaProveedorResumen,
  EntradaProveedorReporte,
  KardexValorizadoReporte,
  PageResponse,
  ProductoBajoMinimoItem,
  ReporteInventarioFilters as ReporteFilters,
  ReporteInventarioTipo,
  ReporteMovimientoItem,
  SalidaInventarioResumen,
  SalidaInventarioReporte,
  SalidaValorizadaOsReporteResponse,
  StockValorizadoReporte,
  StockValorizadoResumen,
} from '../types/reporteInventario.types'

const PAGE_SIZE = 10

const reportes: Array<{ value: ReporteInventarioTipo; label: string; description: string }> = [
  {
    value: 'movimientos',
    label: 'Movimientos',
    description: 'Consulta consolidada de movimientos de inventario.',
  },
  {
    value: 'stock-valorizado',
    label: 'Stock valorizado',
    description: 'Existencias actuales, estado de stock y valorizacion.',
  },
  {
    value: 'kardex-valorizado',
    label: 'Kardex valorizado',
    description: 'Movimientos valorizados por producto, almacen y rango de fechas.',
  },
  {
    value: 'salidas-detalle',
    label: 'Salidas',
    description: 'Consumos, ventas, ajustes negativos y transferencias de salida.',
  },
  {
    value: 'salidas-por-os',
    label: 'Salidas por OS',
    description:
      'Valorizacion comercial de materiales utilizados en salidas de venta por Orden de Servicio.',
  },
  {
    value: 'entradas-proveedor',
    label: 'Entradas por proveedor',
    description: 'Compras, documentos de recepcion y costos informativos.',
  },
  {
    value: 'productos-bajo-minimo',
    label: 'Bajo minimo',
    description: 'Productos con stock actual por debajo del minimo configurado.',
  },
]

type ReportesInventarioPageProps = {
  description?: string
  title?: string
}

function totalElements(reporte: ReporteInventarioTipo, data: unknown) {
  if (reporte === 'kardex-valorizado') {
    return (data as KardexValorizadoReporte | undefined)?.detalles?.length ?? 0
  }

  if (reporte === 'movimientos') {
    return (data as PageResponse<ReporteMovimientoItem> | undefined)?.totalElements ?? 0
  }

  if (reporte === 'stock-valorizado') {
    return (data as StockValorizadoReporte | undefined)?.registros?.totalElements ?? 0
  }

  if (reporte === 'entradas-proveedor') {
    return (data as EntradaProveedorReporte | undefined)?.registros?.totalElements ?? 0
  }

  if (reporte === 'salidas-detalle') {
    return (data as SalidaInventarioReporte | undefined)?.registros?.totalElements ?? 0
  }

  if (reporte === 'salidas-por-os') {
    return (data as SalidaValorizadaOsReporteResponse | undefined)?.registros?.totalElements ?? 0
  }

  if (reporte === 'productos-bajo-minimo') {
    return (data as PageResponse<ProductoBajoMinimoItem> | undefined)?.totalElements ?? 0
  }

  return 0
}

function totalPages(reporte: ReporteInventarioTipo, data: unknown) {
  if (reporte === 'kardex-valorizado') {
    return 1
  }

  if (reporte === 'movimientos') {
    return (data as PageResponse<ReporteMovimientoItem> | undefined)?.totalPages ?? 0
  }

  if (reporte === 'stock-valorizado') {
    return (data as StockValorizadoReporte | undefined)?.registros?.totalPages ?? 0
  }

  if (reporte === 'entradas-proveedor') {
    return (data as EntradaProveedorReporte | undefined)?.registros?.totalPages ?? 0
  }

  if (reporte === 'salidas-detalle') {
    return (data as SalidaInventarioReporte | undefined)?.registros?.totalPages ?? 0
  }

  if (reporte === 'salidas-por-os') {
    return (data as SalidaValorizadaOsReporteResponse | undefined)?.registros?.totalPages ?? 0
  }

  if (reporte === 'productos-bajo-minimo') {
    return (data as PageResponse<ProductoBajoMinimoItem> | undefined)?.totalPages ?? 0
  }

  return 0
}

function defaultTipoForReporte(reporte: ReporteInventarioTipo, current: TipoMovimiento | '') {
  if (!['movimientos', 'salidas-detalle'].includes(reporte)) {
    return ''
  }

  return TIPOS_MOVIMIENTO.includes(current as TipoMovimiento) ? current : ''
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-PE') : ''
}

function formatReportNumber(value?: number | null) {
  return formatReportDecimal(value, '')
}

function reportFilename(reporte: ReporteInventarioTipo) {
  return `reporte-${reporte}-${new Date().toISOString().slice(0, 10)}.pdf`
}

export function ReportesInventarioPage({
  description = 'Consultas consolidadas de movimientos, stock y valorizacion.',
  title = 'Reportes de inventario',
}: ReportesInventarioPageProps) {
  const { user } = useAuth()
  const [{ fechaDesde: initialFechaDesde, fechaHasta: initialFechaHasta }] = useState(
    getCurrentMonthDateRange,
  )
  const [reporte, setReporte] = useState<ReporteInventarioTipo>('movimientos')
  const [texto, setTexto] = useState('')
  const [ordenTrabajo, setOrdenTrabajo] = useState('')
  const [fechaDesde, setFechaDesde] = useState(initialFechaDesde)
  const [fechaHasta, setFechaHasta] = useState(initialFechaHasta)
  const [productoId, setProductoId] = useState<number | null>(null)
  const [almacenId, setAlmacenId] = useState<number | null>(null)
  const [ubicacionId, setUbicacionId] = useState<number | null>(null)
  const [familiaId, setFamiliaId] = useState<number | null>(null)
  const [subfamiliaId, setSubfamiliaId] = useState<number | null>(null)
  const [tipoArticuloId, setTipoArticuloId] = useState<number | null>(null)
  const [marcaId, setMarcaId] = useState<number | null>(null)
  const [proveedorId, setProveedorId] = useState<number | null>(null)
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento | ''>('')
  const [estado, setEstado] = useState<EstadoMovimiento | ''>('')
  const [tipoComprobante, setTipoComprobante] = useState('')
  const [soloConStock, setSoloConStock] = useState(false)
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false)
  const [page, setPage] = useState(0)
  const [exportError, setExportError] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isPdfExporting, setIsPdfExporting] = useState(false)
  const [kardexResolvedProducto, setKardexResolvedProducto] = useState<Producto | null>(null)
  const canView = can(user, 'REPORTE_VER')
  const canViewCosts = can(user, 'REPORTE_COSTOS_VER')
  const canExport = can(user, 'REPORTE_EXPORTAR')

  const filters = useMemo<ReporteFilters>(
    () => ({
      almacenId,
      estado: ['movimientos', 'salidas-detalle', 'salidas-por-os'].includes(reporte)
        ? estado
        : '',
      familiaId,
      fechaDesde: reportUsesDateRange(reporte) ? fechaDesde : '',
      fechaHasta: reportUsesDateRange(reporte) ? fechaHasta : '',
      marcaId: reporte === 'stock-valorizado' ? marcaId : null,
      ordenTrabajo: reporte === 'salidas-por-os' ? ordenTrabajo : '',
      page,
      productoId,
      proveedorId: reporte === 'entradas-proveedor' ? proveedorId : null,
      size: PAGE_SIZE,
      soloBajoMinimo,
      soloConStock,
      subfamiliaId,
      texto,
      tipoArticuloId,
      tipoComprobante: reporte === 'entradas-proveedor' ? tipoComprobante : '',
      tipoMovimiento: defaultTipoForReporte(reporte, tipoMovimiento),
      ubicacionId,
    }),
    [
      almacenId,
      estado,
      familiaId,
      fechaDesde,
      fechaHasta,
      marcaId,
      ordenTrabajo,
      page,
      productoId,
      proveedorId,
      reporte,
      soloBajoMinimo,
      soloConStock,
      subfamiliaId,
      texto,
      tipoArticuloId,
      tipoComprobante,
      tipoMovimiento,
      ubicacionId,
    ],
  )

  const resumenQuery = useQuery({
    enabled: canView,
    queryKey: ['reportes', 'inventario', 'resumen'],
    queryFn: reporteInventarioService.getResumen,
  })

  const stockValorizadoQuery = useQuery({
    enabled: canView && reporte === 'stock-valorizado',
    queryKey: ['reportes', 'stock-valorizado', filters],
    queryFn: () => reporteInventarioService.getStockValorizado(filters),
  })

  const movimientosQuery = useQuery({
    enabled: canView && reporte === 'movimientos',
    queryKey: ['reportes', 'movimientos', filters],
    queryFn: () => reporteInventarioService.getMovimientos(filters),
  })

  const kardexValorizadoQuery = useQuery({
    enabled: canView && reporte === 'kardex-valorizado' && Boolean(productoId),
    queryKey: ['reportes', 'kardex-valorizado', filters],
    queryFn: () => reporteInventarioService.getKardexValorizado(filters),
  })

  const salidasQuery = useQuery({
    enabled: canView && reporte === 'salidas-detalle',
    queryKey: ['reportes', 'salidas-detalle', filters],
    queryFn: () => reporteInventarioService.getSalidasDetalle(filters),
  })

  const salidasPorOsQuery = useQuery({
    enabled: canView && reporte === 'salidas-por-os',
    queryKey: ['reportes', 'salidas-por-os', filters],
    queryFn: () => reporteInventarioService.getSalidasPorOs(filters),
  })

  const entradasProveedorQuery = useQuery({
    enabled: canView && reporte === 'entradas-proveedor',
    queryKey: ['reportes', 'entradas-proveedor', filters],
    queryFn: () => reporteInventarioService.getEntradasProveedor(filters),
  })

  const bajoMinimoQuery = useQuery({
    enabled: canView && reporte === 'productos-bajo-minimo',
    queryKey: ['reportes', 'productos-bajo-minimo', filters],
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

  const ubicacionesQuery = useQuery({
    enabled: canView,
    queryKey: ['ubicaciones-reportes-inventario', almacenId],
    queryFn: () =>
      ubicacionService.getUbicaciones({
        activo: true,
        almacenId,
        page: 0,
        size: 300,
        texto: '',
      }),
  })

  const familiasQuery = useQuery({
    enabled: canView,
    queryKey: ['familias-reportes-inventario'],
    queryFn: familiaService.getFamiliasActivas,
  })

  const subfamiliasQuery = useQuery({
    enabled: canView,
    queryKey: ['subfamilias-reportes-inventario', familiaId],
    queryFn: () =>
      familiaId
        ? subfamiliaService.getSubfamiliasPorFamilia(familiaId)
        : subfamiliaService.getSubfamiliasActivas(),
  })

  const tiposArticuloQuery = useQuery({
    enabled: canView,
    queryKey: ['tipos-articulo-reportes-inventario'],
    queryFn: tipoArticuloService.getTiposArticuloActivos,
  })

  const marcasQuery = useQuery({
    enabled: canView,
    queryKey: ['marcas-reportes-inventario'],
    queryFn: marcaService.getMarcasActivas,
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
      : reporte === 'kardex-valorizado'
        ? kardexValorizadoQuery
        : reporte === 'salidas-detalle'
          ? salidasQuery
          : reporte === 'salidas-por-os'
            ? salidasPorOsQuery
          : reporte === 'entradas-proveedor'
            ? entradasProveedorQuery
            : bajoMinimoQuery

  const activeData = activeQuery?.data
  const activeTotalElements = totalElements(reporte, activeData)
  const activeTotalPages = totalPages(reporte, activeData)

  const resetPage = () => setPage(0)

  const handleReporteChange = (value: ReporteInventarioTipo) => {
    setReporte(value)
    setPage(0)
    setExportError('')
  }

  const handleClear = () => {
    const defaultDateRange = getCurrentMonthDateRange()

    setTexto('')
    setOrdenTrabajo('')
    setFechaDesde(defaultDateRange.fechaDesde)
    setFechaHasta(defaultDateRange.fechaHasta)
    setProductoId(null)
    setAlmacenId(null)
    setUbicacionId(null)
    setFamiliaId(null)
    setSubfamiliaId(null)
    setTipoArticuloId(null)
    setMarcaId(null)
    setProveedorId(null)
    setTipoMovimiento('')
    setEstado('')
    setTipoComprobante('')
    setSoloConStock(false)
    setSoloBajoMinimo(false)
    setPage(0)
    setKardexResolvedProducto(null)
  }

  const resolveKardexProductoId = async () => {
    if (reporte !== 'kardex-valorizado') {
      return productoId
    }

    if (productoId) {
      return productoId
    }

    const searchText = texto.trim()

    if (!searchText) {
      setExportError('Seleccione un producto o ingrese su codigo para consultar el kardex valorizado.')
      return null
    }

    const productosEncontrados = await productoService.getProductos({
      page: 0,
      size: 10,
      texto: searchText,
    })
    const normalizedSearch = searchText.toUpperCase()
    const producto =
      productosEncontrados.content.find(
        (item) => item.codigo?.toUpperCase() === normalizedSearch,
      ) ?? productosEncontrados.content[0]

    if (!producto) {
      setExportError(`No se encontro un producto para "${searchText}".`)
      return null
    }

    setKardexResolvedProducto(producto)
    setProductoId(producto.id)
    setPage(0)
    setExportError('')

    return producto.id
  }

  const handleConsult = async () => {
    setExportError('')

    if (reporte === 'kardex-valorizado') {
      const hadSelectedProduct = Boolean(productoId)
      const resolvedProductoId = await resolveKardexProductoId()

      if (!resolvedProductoId) {
        return
      }

      if (hadSelectedProduct) {
        await kardexValorizadoQuery.refetch()
      }

      return
    }

    await activeQuery?.refetch()
  }

  const handleRefresh = async () => {
    if (reporte === 'kardex-valorizado' && !productoId) {
      await resumenQuery.refetch()
      return
    }

    await Promise.all([resumenQuery.refetch(), activeQuery?.refetch()])
  }

  const handleExportExcel = async () => {
    if (!canExport) {
      return
    }

    setExportError('')
    setIsExporting(true)

    try {
      const exportProductoId =
        reporte === 'kardex-valorizado' ? await resolveKardexProductoId() : productoId

      if (reporte === 'kardex-valorizado' && !exportProductoId) {
        return
      }

      const exportFilters = {
        ...filters,
        productoId: exportProductoId,
      }

      let exportCall = reporteInventarioService.exportProductosBajoMinimo

      if (reporte === 'movimientos') {
        exportCall = reporteInventarioService.exportMovimientos
      } else if (reporte === 'stock-valorizado') {
        exportCall = reporteInventarioService.exportStockValorizado
      } else if (reporte === 'kardex-valorizado') {
        exportCall = reporteInventarioService.exportKardexValorizado
      } else if (reporte === 'salidas-detalle') {
        exportCall = reporteInventarioService.exportSalidasDetalle
      } else if (reporte === 'salidas-por-os') {
        exportCall = reporteInventarioService.exportSalidasPorOs
      } else if (reporte === 'entradas-proveedor') {
        exportCall = reporteInventarioService.exportEntradasProveedor
      }

      const { blob, filename } = await exportCall(exportFilters)
      downloadExcel(blob, filenameFromDisposition(filename, reporte))
    } catch (requestError) {
      setExportError(getReporteInventarioApiErrorMessage(requestError))
    } finally {
      setIsExporting(false)
    }
  }

  const productos = useMemo(() => {
    const items = productosQuery.data?.content ?? []

    if (
      kardexResolvedProducto &&
      !items.some((producto) => producto.id === kardexResolvedProducto.id)
    ) {
      return [kardexResolvedProducto, ...items]
    }

    return items
  }, [kardexResolvedProducto, productosQuery.data?.content])
  const selectedProducto = productos.find((producto) => producto.id === productoId)
  const selectedAlmacen = almacenesQuery.data?.find((almacen) => almacen.id === almacenId)
  const selectedUbicacion = ubicacionesQuery.data?.content.find(
    (ubicacion) => ubicacion.id === ubicacionId,
  )
  const selectedFamilia = familiasQuery.data?.find((familia) => familia.id === familiaId)
  const selectedSubfamilia = subfamiliasQuery.data?.find(
    (subfamilia) => subfamilia.id === subfamiliaId,
  )
  const selectedTipoArticulo = tiposArticuloQuery.data?.find(
    (tipoArticulo) => tipoArticulo.id === tipoArticuloId,
  )
  const selectedMarca = marcasQuery.data?.find((marca) => marca.id === marcaId)
  const selectedProveedor = proveedoresQuery.data?.content.find(
    (proveedor) => proveedor.id === proveedorId,
  )

  const reportFilterLabels = () => [
    ['Reporte', selectedReporte?.label],
    ['Texto', texto],
    ['Orden de Servicio (OS)', ordenTrabajo],
    ['Fecha desde', reportUsesDateRange(reporte) ? fechaDesde : ''],
    ['Fecha hasta', reportUsesDateRange(reporte) ? fechaHasta : ''],
    [
      'Producto',
      selectedProducto ? `${selectedProducto.codigo} - ${selectedProducto.nombre}` : '',
    ],
    ['Almacen', selectedAlmacen ? `${selectedAlmacen.codigo} - ${selectedAlmacen.nombre}` : ''],
    [
      'Ubicacion',
      selectedUbicacion ? `${selectedUbicacion.codigo} - ${selectedUbicacion.nombre}` : '',
    ],
    ['Familia', selectedFamilia?.nombre],
    ['Subfamilia', selectedSubfamilia?.nombre],
    ['Tipo articulo', selectedTipoArticulo?.nombre],
    ['Marca', selectedMarca?.nombre],
    [
      'Proveedor',
      selectedProveedor
        ? `${selectedProveedor.numeroDocumento} - ${selectedProveedor.razonSocial}`
        : '',
    ],
    ['Tipo movimiento', tipoMovimiento ? formatMovimientoLabel(tipoMovimiento) : ''],
    ['Estado', estado ? formatMovimientoLabel(estado) : ''],
    ['Tipo comprobante', tipoComprobante],
    ['Solo con stock', soloConStock ? 'Si' : ''],
    ['Solo bajo minimo', soloBajoMinimo ? 'Si' : ''],
  ] satisfies Array<[string, string | number | boolean | null | undefined]>
  const reportFilters = reportFilterLabels

  const handleExportPdf = async () => {
    if (!canExport) {
      return
    }

    setExportError('')
    setIsPdfExporting(true)

    try {
      const pdfProductoId =
        reporte === 'kardex-valorizado' ? await resolveKardexProductoId() : productoId

      if (reporte === 'kardex-valorizado' && !pdfProductoId) {
        return
      }

      const pdfFilters = {
        ...filters,
        productoId: pdfProductoId,
      }
      const reportTitle = selectedReporte?.label
        ? `Reporte de ${selectedReporte.label.toLowerCase()}`
        : 'Reporte de inventario'

      if (reporte === 'movimientos') {
        const rows = await fetchAllReportRows((page, size) =>
          reporteInventarioService.getMovimientos({ ...pdfFilters, page, size }),
        )
        await downloadPdfReport({
          columnWeights: {
            cantidad: 1.15,
            documento: 1.35,
            movimiento: 1.35,
            producto: 2.25,
            'total linea': 1.15,
          },
          filename: reportFilename(reporte),
          filters: reportFilters(),
          logoSrc: logoBallena,
          subtitle: selectedReporte?.description,
          tableHeaderFontSize: 5.8,
          tableRowFontSize: 5.8,
          tableRowHeight: 44,
          tableRowLineHeight: 8,
          tableRowMaxLines: 4,
          title: reportTitle,
          rows: rows.map((row) => buildMovimientoPdfRow(row, canViewCosts)),
        })
        return
      }

      if (reporte === 'stock-valorizado') {
        let stockSummary: StockValorizadoResumen | null | undefined
        const rows = await fetchAllReportRows(async (page, size) => {
          const data = await reporteInventarioService.getStockValorizado({
            ...pdfFilters,
            page,
            size,
          })
          stockSummary ??= data.resumen
          return data.registros
        })
        await downloadPdfReport({
          columnWeights: {
            almacen: 1.25,
            codigo: 1.05,
            'costo promedio': 1.05,
            estado: 1,
            producto: 2.2,
            stock: 0.75,
            'stock minimo': 0.95,
            'u.m.': 0.55,
            ubicacion: 0.9,
            'valor total': 1,
          },
          filename: reportFilename(reporte),
          filters: reportFilters(),
          logoSrc: logoBallena,
          subtitle: selectedReporte?.description,
          summary: buildStockValorizadoPdfSummary(stockSummary, canViewCosts),
          summaryTitle: 'Resumen de stock valorizado',
          tableHeaderFontSize: 6,
          tableRowFontSize: 5.9,
          tableRowLineHeight: 8.5,
          tableRowMaxLines: 3,
          title: reportTitle,
          rows: rows.map((row) => ({
            Codigo: row.codigoProducto,
            Producto: row.nombreProducto,
            'U.M.': row.unidadMedida,
            Almacen: row.almacen,
            Ubicacion: row.ubicacion,
            Stock: formatReportNumber(row.cantidadActual),
            'Stock minimo': formatReportNumber(row.stockMinimo),
            Estado: row.estadoStock,
            ...(canViewCosts
              ? {
                  'Costo promedio': formatReportNumber(row.costoPromedio),
                  'Valor total': formatReportNumber(row.valorTotal),
                }
              : {}),
          })),
        })
        return
      }

      if (reporte === 'kardex-valorizado') {
        const data = await reporteInventarioService.getKardexValorizado({
          ...pdfFilters,
          page: 0,
          size: PAGE_SIZE,
        })
        await downloadPdfReport({
          centerAlignedColumns: ['Tipo'],
          columnWeights: {
            entrada: 0.72,
            fecha: 1.05,
            movimiento: 1.1,
            salida: 0.72,
            'saldo ant.': 0.82,
            'saldo final': 0.82,
            tipo: 1.12,
            'costo mov.': 0.88,
            'costo prom.': 0.88,
            'valor entrada': 0.9,
            'valor salida': 0.9,
            'valor saldo': 0.9,
          },
          filename: reportFilename(reporte),
          filters: reportFilters(),
          infoColumns: 3,
          logoSrc: logoBallena,
          rightAlignedColumns: [
            'Entrada',
            'Salida',
            'Saldo ant.',
            'Saldo final',
            'Costo mov.',
            'Costo prom.',
            'Valor entrada',
            'Valor salida',
            'Valor saldo',
          ],
          subtitle: selectedReporte?.description,
          summary: buildKardexPdfSummary(data, canViewCosts),
          summaryColumns: 6,
          summaryTitle: 'Resumen del kardex',
          tableHeaderFontSize: canViewCosts ? 5 : 6.2,
          tableRowFontSize: canViewCosts ? 5.1 : 6.2,
          tableRowHeight: 30,
          tableRowLineHeight: 7,
          tableRowMaxLines: 3,
          title: reportTitle,
          rows: data.detalles.map((row) => buildKardexPdfRow(row, canViewCosts, formatDateTime)),
        })
        return
      }

      if (reporte === 'entradas-proveedor') {
        let entradasSummary: EntradaProveedorResumen | null | undefined
        const rows = await fetchAllReportRows(async (page, size) => {
          const data = await reporteInventarioService.getEntradasProveedor({
            ...pdfFilters,
            page,
            size,
          })
          entradasSummary ??= data.resumen
          return data.registros
        })
        const groupedTable = buildEntradasProveedorPdfTable(rows, canViewCosts, formatDateTime)
        await downloadPdfReport({
          centerAlignedColumns: ['Almacen', 'U.M.'],
          columnWeights: {
            almacen: 0.62,
            cantidad: 0.7,
            comprobante: 1.22,
            'costo unit.': 0.84,
            fecha: 1,
            flete: 0.64,
            guia: 0.85,
            movimiento: 1.05,
            movilidad: 0.68,
            otros: 0.62,
            producto: 2.1,
            'u.m.': 0.5,
            'valor linea': 0.86,
          },
          filename: reportFilename(reporte),
          filters: reportFilters(),
          infoColumns: 3,
          logoSrc: logoBallena,
          recordCount: groupedTable.recordCount,
          rightAlignedColumns: [
            'Cantidad',
            'Costo unit.',
            'Valor linea',
            'Flete',
            'Movilidad',
            'Otros',
          ],
          rowKinds: groupedTable.rowKinds,
          subtitle: selectedReporte?.description,
          summary: buildEntradasProveedorPdfSummary(entradasSummary, canViewCosts),
          summaryColumns: 5,
          summaryTitle: 'Resumen de entradas',
          tableHeaderFontSize: canViewCosts ? 4.6 : 5.8,
          tableRowFontSize: canViewCosts ? 4.8 : 5.9,
          tableRowHeight: 24,
          tableRowLineHeight: 6.5,
          tableRowMaxLines: 2,
          title: reportTitle,
          rows: groupedTable.rows,
        })
        return
      }

      if (reporte === 'salidas-detalle') {
        let salidasSummary: SalidaInventarioResumen | null | undefined
        const rows = await fetchAllReportRows(async (page, size) => {
          const data = await reporteInventarioService.getSalidasDetalle({
            ...pdfFilters,
            page,
            size,
          })
          salidasSummary ??= data.resumen
          return data.registros
        })
        const commercialRows = canViewCosts
          ? await fetchAllReportRows(async (page, size) => {
              const data = await reporteInventarioService.getSalidasPorOs({
                ...pdfFilters,
                page,
                size,
              })
              return data.registros
            })
          : []
        const commercialByLine = new Map(
          commercialRows.map((row) => [`${row.movimientoId}|${row.productoId}`, row]),
        )
        await downloadPdfReport({
          centerAlignedColumns: ['Tipo', 'U.M.'],
          columnWeights: {
            'base comercial s/igv': 0.85,
            cantidad: 0.62,
            'costo aplicado': 0.76,
            fecha: 0.92,
            movimiento: 1,
            motivo: 1.05,
            origen: 1,
            'precio total c/igv': 0.9,
            producto: 2.1,
            recargo: 0.58,
            tipo: 0.95,
            'u.m.': 0.45,
            'valor salida': 0.8,
          },
          filename: reportFilename(reporte),
          filters: reportFilters(),
          infoColumns: 3,
          logoSrc: logoBallena,
          rightAlignedColumns: [
            'Cantidad',
            'Costo aplicado',
            'Valor salida',
            'Base comercial s/IGV',
            'Recargo',
            'Precio total c/IGV',
          ],
          subtitle: selectedReporte?.description,
          summary: buildSalidasPdfSummary(salidasSummary, canViewCosts),
          summaryColumns: 4,
          summaryTitle: 'Resumen de salidas',
          tableHeaderFontSize: canViewCosts ? 4.5 : 5.8,
          tableRowFontSize: canViewCosts ? 4.7 : 5.9,
          tableRowHeight: 30,
          tableRowLineHeight: canViewCosts ? 6.6 : 7.5,
          tableRowMaxLines: 3,
          title: reportTitle,
          rows: rows.map((row) =>
            buildSalidaPdfRow(
              row,
              canViewCosts,
              formatDateTime,
              commercialByLine.get(`${row.movimientoId}|${row.productoId}`),
            ),
          ),
        })
        return
      }

      if (reporte === 'salidas-por-os') {
        const rows = await fetchAllReportRows(async (page, size) => {
          const data = await reporteInventarioService.getSalidasPorOs({
            ...pdfFilters,
            page,
            size,
          })
          return data.registros
        })
        const groupedTable = buildSalidasPorOsPdfTable(rows, canViewCosts)
        await downloadPdfReport({
          columnWeights: {
            cantidad: 0.7,
            'costo inventario': 1.05,
            'precio base s/igv': 1.08,
            'precio final c/igv': 1.12,
            producto: 2.8,
            recargo: 0.72,
          },
          filename: reportFilename(reporte),
          filters: reportFilters(),
          infoColumns: 3,
          logoSrc: logoBallena,
          recordCount: groupedTable.recordCount,
          rightAlignedColumns: [
            'Cantidad',
            'Costo inventario',
            'Precio base s/IGV',
            'Recargo',
            'Precio final c/IGV',
          ],
          rowKinds: groupedTable.rowKinds,
          subtitle: selectedReporte?.description,
          tableHeaderFontSize: 6.8,
          tableRowFontSize: 6.6,
          tableRowHeight: 24,
          tableRowLineHeight: 8,
          tableRowMaxLines: 2,
          title: reportTitle,
          rows: groupedTable.rows,
        })
        return
      }

      const rows = await fetchAllReportRows((page, size) =>
        reporteInventarioService.getProductosBajoMinimo({ ...pdfFilters, page, size }),
      )
      await downloadPdfReport({
        centerAlignedColumns: ['Almacen'],
        columnWeights: {
          almacen: 0.72,
          'cantidad actual': 0.92,
          categoria: 1.15,
          codigo: 1.05,
          diferencia: 0.88,
          producto: 2.3,
          'stock minimo': 0.9,
        },
        filename: reportFilename(reporte),
        filters: reportFilters(),
        logoSrc: logoBallena,
        rightAlignedColumns: ['Cantidad actual', 'Stock minimo', 'Diferencia'],
        subtitle: selectedReporte?.description,
        tableHeaderFontSize: 6.4,
        tableRowFontSize: 6.4,
        tableRowHeight: 28,
        tableRowLineHeight: 8,
        tableRowMaxLines: 2,
        title: reportTitle,
        rows: rows.map(buildBajoMinimoPdfRow),
      })
    } catch (requestError) {
      setExportError(getReporteInventarioApiErrorMessage(requestError))
    } finally {
      setIsPdfExporting(false)
    }
  }

  const selectedReporte = reportes.find((item) => item.value === reporte)

  if (!canView) {
    return (
      <div>
        <PageHeader
          title={title}
          description={description}
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
          title={title}
          description={description}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={activeQuery?.isFetching || resumenQuery.isFetching}
            onClick={handleRefresh}
            type="button"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
        </div>
      </div>

      {resumenQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getReporteInventarioApiErrorMessage(resumenQuery.error)}
        </div>
      ) : null}

      {exportError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {exportError}
        </div>
      ) : null}

      <div className="mb-6">
        <ResumenInventarioCards
          isLoading={resumenQuery.isLoading}
          resumen={resumenQuery.data}
        />
      </div>

      {activeQuery?.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getReporteInventarioApiErrorMessage(activeQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <div className="mb-5 flex flex-wrap gap-2">
          {reportes.map((item) => (
            <button
              className={`inline-flex h-9 items-center rounded-md border px-4 text-sm font-semibold transition ${
                reporte === item.value
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-cyan-50/60'
              }`}
              key={item.value}
              onClick={() => handleReporteChange(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {selectedReporte ? (
          <div className="mb-4 rounded-md border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm text-cyan-900">
            {selectedReporte.description}
          </div>
        ) : null}

        <ReporteInventarioFilters
          actions={
            <>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!canExport || isPdfExporting}
                onClick={handleExportPdf}
                title={
                  !canExport
                    ? 'No tiene permiso REPORTE_EXPORTAR'
                    : 'Exporta la vista actual usando impresion del navegador'
                }
                type="button"
              >
                <FileText size={17} />
                {isPdfExporting ? 'Generando...' : 'PDF informe'}
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!canExport || isExporting}
                onClick={handleExportExcel}
                title={!canExport ? 'No tiene permiso REPORTE_EXPORTAR' : undefined}
                type="button"
              >
                <Download size={17} />
                {isExporting
                  ? 'Exportando...'
                  : reporte === 'salidas-por-os'
                    ? 'Exportar Excel'
                    : 'Exportar data'}
              </button>
            </>
          }
          almacenId={almacenId}
          almacenes={almacenesQuery.data ?? []}
          estado={estado}
          familiaId={familiaId}
          familias={familiasQuery.data ?? []}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          marcaId={marcaId}
          marcas={marcasQuery.data ?? []}
          onAlmacenChange={(value) => {
            setAlmacenId(value)
            setUbicacionId(null)
            resetPage()
          }}
          onClear={handleClear}
          onConsult={handleConsult}
          onEstadoChange={(value) => {
            setEstado(value)
            resetPage()
          }}
          onFamiliaChange={(value) => {
            setFamiliaId(value)
            setSubfamiliaId(null)
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
          onMarcaChange={(value) => {
            setMarcaId(value)
            resetPage()
          }}
          onOrdenTrabajoChange={(value) => {
            setOrdenTrabajo(value)
            resetPage()
          }}
          onProductoChange={(value) => {
            setProductoId(value)
            setKardexResolvedProducto(null)
            resetPage()
          }}
          onProveedorChange={(value) => {
            setProveedorId(value)
            resetPage()
          }}
          onSoloBajoMinimoChange={(value) => {
            setSoloBajoMinimo(value)
            resetPage()
          }}
          onSoloConStockChange={(value) => {
            setSoloConStock(value)
            resetPage()
          }}
          onSubfamiliaChange={(value) => {
            setSubfamiliaId(value)
            resetPage()
          }}
          onTextoChange={(value) => {
            setTexto(value)
            if (reporte === 'kardex-valorizado') {
              setProductoId(null)
              setKardexResolvedProducto(null)
            }
            resetPage()
          }}
          onTipoArticuloChange={(value) => {
            setTipoArticuloId(value)
            resetPage()
          }}
          onTipoComprobanteChange={(value) => {
            setTipoComprobante(value)
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
          productos={productos}
          proveedorId={proveedorId}
          proveedores={proveedoresQuery.data?.content ?? []}
          reporte={reporte}
          ordenTrabajo={ordenTrabajo}
          soloBajoMinimo={soloBajoMinimo}
          soloConStock={soloConStock}
          subfamiliaId={subfamiliaId}
          subfamilias={subfamiliasQuery.data ?? []}
          texto={texto}
          tipoArticuloId={tipoArticuloId}
          tipoComprobante={tipoComprobante}
          tipoMovimiento={tipoMovimiento}
          tiposArticulo={tiposArticuloQuery.data ?? []}
          ubicacionId={ubicacionId}
          ubicaciones={ubicacionesQuery.data?.content ?? []}
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
          resumen={stockValorizadoQuery.data?.resumen}
          rows={stockValorizadoQuery.data?.registros.content ?? []}
          showCosts={canViewCosts}
          totalLines={stockValorizadoQuery.data?.registros.totalElements}
        />
      ) : reporte === 'kardex-valorizado' ? (
        <KardexValorizadoTable
          isLoading={kardexValorizadoQuery.isLoading}
          reporte={kardexValorizadoQuery.data}
          showCosts={canViewCosts}
        />
      ) : reporte === 'entradas-proveedor' ? (
        <EntradasProveedorTable
          isLoading={entradasProveedorQuery.isLoading}
          resumen={entradasProveedorQuery.data?.resumen}
          rows={entradasProveedorQuery.data?.registros.content ?? []}
          showCosts={canViewCosts}
        />
      ) : reporte === 'salidas-detalle' ? (
        <SalidasInventarioTable
          isLoading={salidasQuery.isLoading}
          resumen={salidasQuery.data?.resumen}
          rows={salidasQuery.data?.registros.content ?? []}
          showCosts={canViewCosts}
        />
      ) : reporte === 'salidas-por-os' ? (
        <SalidasPorOsTable
          isLoading={salidasPorOsQuery.isLoading}
          resumenPorOs={salidasPorOsQuery.data?.resumenPorOs}
          rows={salidasPorOsQuery.data?.registros.content ?? []}
          showCosts={canViewCosts}
        />
      ) : (
        <ProductosBajoMinimoTable
          isLoading={bajoMinimoQuery.isLoading}
          rows={bajoMinimoQuery.data?.content ?? []}
        />
      )}

      {reporte !== 'kardex-valorizado' ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {activeTotalElements} registro{activeTotalElements === 1 ? '' : 's'} encontrado
            {activeTotalElements === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page === 0 || activeQuery?.isFetching}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
              type="button"
            >
              Anterior
            </button>
            <span className="min-w-28 text-center">
              Pagina {activeTotalPages === 0 ? 0 : page + 1} de {activeTotalPages}
            </span>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page + 1 >= activeTotalPages || activeQuery?.isFetching}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
