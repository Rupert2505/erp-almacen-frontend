import { FileText, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import logoBallena from '../../../../assets/images/logo_ballena_02.png'
import { formatApiDate, formatApiDateTime } from '../../../../shared/utils/dateTime'
import { formatOptionalCurrency } from '../../../../shared/utils/numberFormat'
import { openPdfReport } from '../../../../shared/utils/pdfReport'
import { MovimientoDetalleTable } from './MovimientoDetalleTable'
import { MovimientoValorizacionComercial } from './MovimientoValorizacionComercial'
import type { Movimiento } from '../types/movimiento.types'
import { formatMovimientoLabel } from '../utils/movimientoLabels'

type MovimientoViewModalProps = {
  isOpen: boolean
  isLoading: boolean
  isRegistrarDevolucionLoading?: boolean
  movimiento?: Movimiento | null
  onClose: () => void
  onRegistrarDevolucion?: () => void
  showPdfButton?: boolean
  showRegistrarDevolucion?: boolean
}

function formatDateTime(value?: string | null) {
  return formatApiDateTime(value, 'medium')
}

function formatDate(value?: string | null) {
  return formatApiDate(value, 'medium')
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value ?? '-'}</p>
    </div>
  )
}

function formatPdfNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return ''
  }

  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value)
}

export function MovimientoViewModal({
  isLoading,
  isRegistrarDevolucionLoading = false,
  isOpen,
  movimiento,
  onClose,
  onRegistrarDevolucion,
  showPdfButton = false,
  showRegistrarDevolucion = false,
}: MovimientoViewModalProps) {
  const [pdfError, setPdfError] = useState('')
  const [isPdfLoading, setIsPdfLoading] = useState(false)

  if (!isOpen) {
    return null
  }

  const handleOpenPdf = async () => {
    if (!movimiento?.id) {
      return
    }

    setPdfError('')
    setIsPdfLoading(true)

    try {
      await openPdfReport({
        filename: `movimiento-${movimiento.numero}.pdf`,
        filters: [
          ['Numero', movimiento.numero],
          ['Tipo', formatMovimientoLabel(movimiento.tipoMovimiento)],
          ['Estado', formatMovimientoLabel(movimiento.estado)],
          ['Fecha movimiento', formatDateTime(movimiento.fechaMovimiento)],
          ['Almacen origen', movimiento.almacenOrigenNombre],
          ['Almacen destino', movimiento.almacenDestinoNombre],
          ['Proveedor', movimiento.proveedorRazonSocial],
          ['Documento', movimiento.documentoReferencia],
          ['Nota de credito', movimiento.numeroNotaCredito],
          ['Usuario', movimiento.username],
          ['Movimiento origen', movimiento.movimientoOrigenNumero],
          ['Observacion', movimiento.observacion],
        ],
        infoColumns: 3,
        infoMaxItems: 12,
        infoTitle: 'Datos del movimiento',
        logoSrc: logoBallena,
        subtitle: 'Comprobante operativo generado desde el detalle del movimiento.',
        title: `Comprobante de ${formatMovimientoLabel(movimiento.tipoMovimiento)}`,
        rows: (movimiento.detalles ?? []).map((detalle) => ({
          Codigo: detalle.productoCodigo,
          Producto: detalle.productoNombre,
          Origen: [detalle.ubicacionOrigenCodigo, detalle.ubicacionOrigenNombre]
            .filter(Boolean)
            .join(' - '),
          Destino: [detalle.ubicacionDestinoCodigo, detalle.ubicacionDestinoNombre]
            .filter(Boolean)
            .join(' - '),
          Cantidad: formatPdfNumber(detalle.cantidad),
          'Costo unit.': formatPdfNumber(
            detalle.costoUnitarioInventariable ?? detalle.costoUnitario,
          ),
          Total: formatPdfNumber(detalle.totalInventariable ?? detalle.totalLinea),
          'Costo doc.': formatPdfNumber(detalle.costoDocumentoUnitario),
          'Valor stock': formatPdfNumber(detalle.valorStock),
          'Valor doc.': formatPdfNumber(detalle.valorDocumento),
          Diferencia: formatPdfNumber(detalle.diferenciaValorizacion),
        })),
      })
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'No se pudo generar el PDF del movimiento.')
    } finally {
      setIsPdfLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold text-white">Detalle de movimiento</h2>
            <p className="mt-1 text-sm text-slate-300">{movimiento?.numero ?? 'Cargando...'}</p>
          </div>
          <div className="flex items-center gap-2">
            {showPdfButton ? (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPdfLoading || isLoading || !movimiento?.id}
                onClick={handleOpenPdf}
                type="button"
              >
                <FileText size={16} />
                {isPdfLoading ? 'Generando...' : 'PDF'}
              </button>
            ) : null}
            {showRegistrarDevolucion ? (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-500 px-3 text-sm font-semibold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isRegistrarDevolucionLoading || isLoading}
                onClick={onRegistrarDevolucion}
                type="button"
              >
                <RotateCcw size={16} />
                {isRegistrarDevolucionLoading ? 'Validando...' : 'Registrar devolucion'}
              </button>
            ) : null}
            <button
              aria-label="Cerrar"
              className="grid h-9 w-9 place-items-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {pdfError ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pdfError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Cargando detalle...
            </div>
          ) : null}

          {!isLoading && movimiento ? (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Numero" value={movimiento.numero} />
                <InfoItem label="Tipo" value={formatMovimientoLabel(movimiento.tipoMovimiento)} />
                <InfoItem label="Estado" value={formatMovimientoLabel(movimiento.estado)} />
                <InfoItem label="Movimiento origen" value={movimiento.movimientoOrigenNumero} />
                <InfoItem label="Fecha movimiento" value={formatDateTime(movimiento.fechaMovimiento)} />
                <InfoItem label="Documento referencia" value={movimiento.documentoReferencia} />
                <InfoItem label="Nota de credito" value={movimiento.numeroNotaCredito} />
                <InfoItem label="Fecha documento" value={formatDate(movimiento.fechaDocumento)} />
                <InfoItem label="Proveedor" value={movimiento.proveedorRazonSocial} />
                {movimiento.tipoMovimiento === 'SALIDA_VENTA' ? (
                  <InfoItem label="Orden de Servicio (OS)" value={movimiento.ordenTrabajo} />
                ) : movimiento.tipoMovimiento === 'SALIDA_CONSUMO' ? (
                  <InfoItem label="Orden trabajo" value={movimiento.ordenTrabajo} />
                ) : null}
                <InfoItem label="Almacen origen" value={movimiento.almacenOrigenNombre} />
                <InfoItem label="Almacen destino" value={movimiento.almacenDestinoNombre} />
                <InfoItem label="Usuario" value={movimiento.username} />
                <InfoItem label="Confirmado en" value={formatDateTime(movimiento.confirmadoEn)} />
                <InfoItem label="Anulado en" value={formatDateTime(movimiento.anuladoEn)} />
                <InfoItem label="Creado en" value={formatDateTime(movimiento.creadoEn)} />
              </div>

              {movimiento.estado === 'CANCELADO' ? (
                <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Motivo cancelacion" value={movimiento.motivoCancelacion} />
                  <InfoItem label="Cancelado por" value={movimiento.canceladoPor} />
                  <InfoItem label="Cancelado en" value={formatDateTime(movimiento.canceladoEn)} />
                </div>
              ) : null}

              {movimiento.estado === 'ANULADO' ? (
                <div className="grid gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Motivo anulacion" value={movimiento.motivoAnulacion} />
                  <InfoItem label="Anulado por" value={movimiento.anuladoPor} />
                  <InfoItem label="Anulado en" value={formatDateTime(movimiento.anuladoEn)} />
                </div>
              ) : null}

              {movimiento.tipoMovimiento === 'ENTRADA_COMPRA' ? (
                <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem label="Serie guia" value={movimiento.guiaSerie} />
                  <InfoItem label="Numero guia" value={movimiento.guiaNumero} />
                  <InfoItem label="Fecha guia" value={formatDate(movimiento.guiaFecha)} />
                  <InfoItem label="Tipo comprobante" value={movimiento.comprobanteTipo} />
                  <InfoItem label="Serie comprobante" value={movimiento.comprobanteSerie} />
                  <InfoItem label="Numero comprobante" value={movimiento.comprobanteNumero} />
                  <InfoItem
                    label="Fecha emision"
                    value={formatDate(movimiento.comprobanteFechaEmision)}
                  />
                  <InfoItem
                    label="Orden compra"
                    value={movimiento.ordenCompraNumero ?? movimiento.ordenCompra}
                  />
                  <InfoItem label="Fecha pedido" value={formatDate(movimiento.fechaPedido)} />
                  <InfoItem
                    label="Fecha recepcion"
                    value={formatDate(movimiento.fechaRecepcion)}
                  />
                  <InfoItem label="Flete" value={formatOptionalCurrency(movimiento.flete)} />
                  <InfoItem label="Movilidad" value={formatOptionalCurrency(movimiento.movilidad)} />
                  <InfoItem label="Otros gastos" value={formatOptionalCurrency(movimiento.otrosGastos)} />
                  <InfoItem
                    label="Observacion documentaria"
                    value={movimiento.observacionDocumentaria}
                  />
                </div>
              ) : null}

              {movimiento.observacion ? (
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Observacion
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{movimiento.observacion}</p>
                </div>
              ) : null}

              {movimiento.tipoMovimiento === 'SALIDA_VENTA' ? (
                <MovimientoValorizacionComercial detalles={movimiento.detalles ?? []} />
              ) : (
                <MovimientoDetalleTable detalles={movimiento.detalles ?? []} />
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
