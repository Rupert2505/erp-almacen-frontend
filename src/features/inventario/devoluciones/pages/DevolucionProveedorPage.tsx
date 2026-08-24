import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../../../../shared/components/Card'
import { PageHeader } from '../../../../shared/components/PageHeader'
import { formatApiDateTime, toLocalDateTimePayload } from '../../../../shared/utils/dateTime'
import { formatOptionalNumber } from '../../../../shared/utils/numberFormat'
import { can } from '../../../../shared/utils/permissions'
import { useAuth } from '../../../auth/context/useAuth'
import { MovimientoViewModal } from '../../movimientos/components/MovimientoViewModal'
import {
  getMovimientoApiErrorMessage,
  movimientoService,
  shouldRefreshMovimientoAfterError,
} from '../../movimientos/services/movimientoService'
import type { DevolucionProveedorPayload, Movimiento } from '../../movimientos/types/movimiento.types'
import { formatMovimientoLabel } from '../../movimientos/utils/movimientoLabels'
import { DevolucionProveedorDetalleTable } from '../components/DevolucionProveedorDetalleTable'
import { DevolucionProveedorHistorialTable } from '../components/DevolucionProveedorHistorialTable'
import {
  devolucionProveedorSchema,
  type DevolucionProveedorFormInput,
  type DevolucionProveedorFormValues,
} from '../schemas/devolucionProveedorSchema'

type Feedback = {
  type: 'success' | 'error'
  message: string
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const textareaClass =
  'min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

function formatDate(value?: string | null) {
  return formatApiDateTime(value, 'medium')
}

function initialValues(): DevolucionProveedorFormInput {
  return {
    motivo: '',
    observacion: '',
    numeroNotaCredito: '',
    fechaDocumento: '',
    detalles: [],
  }
}

export function DevolucionProveedorPage() {
  const { entradaId } = useParams()
  const entradaIdNumber = Number(entradaId)
  const isValidEntradaId = Number.isFinite(entradaIdNumber) && entradaIdNumber > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmValues, setConfirmValues] = useState<DevolucionProveedorFormValues | null>(null)
  const [viewMovimiento, setViewMovimiento] = useState<Movimiento | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isViewLoading, setIsViewLoading] = useState(false)

  const canView = can(user, 'INVENTARIO_DEVOLUCION_VER')
  const canCreate = can(user, 'INVENTARIO_DEVOLUCION_CREAR')
  const canConfirm = can(user, 'INVENTARIO_DEVOLUCION_CONFIRMAR')

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<DevolucionProveedorFormInput>({
    defaultValues: initialValues(),
    resolver: zodResolver(devolucionProveedorSchema),
  })

  const entradaQuery = useQuery({
    enabled: isValidEntradaId && canView && canCreate,
    queryKey: ['movimiento-detalle', entradaIdNumber],
    queryFn: () => movimientoService.getMovimiento(entradaIdNumber),
  })

  const cantidadesQuery = useQuery({
    enabled: isValidEntradaId && canView && canCreate,
    queryKey: ['cantidades-devolucion', entradaIdNumber],
    queryFn: () => movimientoService.getCantidadesDevolucion(entradaIdNumber),
  })

  const devolucionesQuery = useQuery({
    enabled: isValidEntradaId && canView && canCreate,
    queryKey: ['devoluciones-proveedor', entradaIdNumber],
    queryFn: () => movimientoService.getDevolucionesProveedor(entradaIdNumber),
  })

  useEffect(() => {
    const detalles = cantidadesQuery.data ?? []

    reset({
      ...initialValues(),
      detalles: detalles.map((detalle) => ({
        seleccionado: false,
        movimientoDetalleOrigenId: detalle.movimientoDetalleOrigenId,
        productoId: detalle.productoId,
        cantidadPendienteDevolver: Number(detalle.cantidadPendienteDevolver ?? 0),
        cantidad: undefined,
        observacion: '',
      })),
    })
  }, [cantidadesQuery.data, reset])

  const invalidateData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] }),
      queryClient.invalidateQueries({ queryKey: ['movimiento-detalle', entradaIdNumber] }),
      queryClient.invalidateQueries({ queryKey: ['cantidades-devolucion', entradaIdNumber] }),
      queryClient.invalidateQueries({ queryKey: ['devoluciones-proveedor', entradaIdNumber] }),
      queryClient.invalidateQueries({ queryKey: ['stock-actual'] }),
      queryClient.invalidateQueries({ queryKey: ['stock-bajo-minimo'] }),
      queryClient.invalidateQueries({ queryKey: ['kardex'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-resumen'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-movimientos'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-stock-valorizado'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-entradas-proveedor'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-salidas'] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: ({
      confirmar,
      values,
    }: {
      confirmar: boolean
      values: DevolucionProveedorFormValues
    }) => {
      const entrada = entradaQuery.data
      const detalles = values.detalles
        .filter((detalle) => detalle.seleccionado)
        .map((detalle) => ({
          movimientoDetalleOrigenId: detalle.movimientoDetalleOrigenId,
          productoId: detalle.productoId,
          cantidad: Number(detalle.cantidad),
          observacion: detalle.observacion?.trim() || null,
        }))

      const payload: DevolucionProveedorPayload = {
        movimientoOrigenId: entradaIdNumber,
        proveedorId: entrada?.proveedorId ?? null,
        fechaMovimiento: toLocalDateTimePayload(),
        fechaDocumento: values.fechaDocumento || null,
        numeroNotaCredito: values.numeroNotaCredito?.trim() || null,
        motivo: values.motivo.trim(),
        observacion: values.observacion?.trim() || null,
        confirmar,
        detalles,
      }

      return movimientoService.createDevolucionProveedor(payload)
    },
    onSuccess: async (movimiento, variables) => {
      await invalidateData()
      setConfirmValues(null)
      setFeedback({
        type: 'success',
        message: variables.confirmar
          ? `La devolucion ${movimiento.numero} fue guardada y confirmada correctamente.`
          : `La devolucion ${movimiento.numero} fue guardada como borrador.`,
      })
    },
    onError: async (error) => {
      setFeedback({
        type: 'error',
        message: getMovimientoApiErrorMessage(error),
      })

      if (shouldRefreshMovimientoAfterError(error)) {
        await invalidateData()
      }
    },
  })

  const openView = async (movimiento: Movimiento) => {
    setIsViewOpen(true)
    setIsViewLoading(true)
    setViewMovimiento(movimiento)

    try {
      const detalle = await movimientoService.getMovimiento(movimiento.id)
      setViewMovimiento(detalle)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getMovimientoApiErrorMessage(error),
      })
      setIsViewOpen(false)
    } finally {
      setIsViewLoading(false)
    }
  }

  const guardar = async (values: DevolucionProveedorFormInput, confirmar: boolean) => {
    setFeedback(null)
    await createMutation.mutateAsync({
      confirmar,
      values: devolucionProveedorSchema.parse(values),
    })
  }

  const entrada = entradaQuery.data
  const cantidades = cantidadesQuery.data ?? []
  const devoluciones = devolucionesQuery.data ?? []
  const tienePendiente = cantidades.some(
    (detalle) => Number(detalle.cantidadPendienteDevolver ?? 0) > 0,
  )
  const puedeRegistrar =
    canCreate &&
    entrada?.tipoMovimiento === 'ENTRADA_COMPRA' &&
    entrada.estado === 'CONFIRMADO' &&
    tienePendiente
  const puedeConfirmar = puedeRegistrar && canConfirm

  if (!canView || !canCreate) {
    return (
      <div>
        <PageHeader
          title="Devolucion a proveedor"
          description="Registro controlado desde una entrada de compra confirmada."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para registrar devoluciones a proveedor.
          </p>
        </Card>
      </div>
    )
  }

  if (!isValidEntradaId) {
    return (
      <div>
        <PageHeader title="Devolucion a proveedor" />
        <Card className="p-6">
          <p className="text-sm text-red-700">La entrada indicada no es valida.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Devolucion a proveedor"
          description="Registre cantidades a devolver sin alterar la entrada original."
        />
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => navigate('/inventario/movimientos')}
          type="button"
        >
          <ArrowLeft size={17} />
          Volver a movimientos
        </button>
      </div>

      {feedback ? (
        <div
          className={`mb-5 rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {entradaQuery.isError || cantidadesQuery.isError || devolucionesQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getMovimientoApiErrorMessage(
            entradaQuery.error ?? cantidadesQuery.error ?? devolucionesQuery.error,
          )}
        </div>
      ) : null}

      <div className="space-y-5">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-950">Entrada de origen</h2>
            <p className="mt-1 text-sm text-slate-500">
              La entrada original permanece confirmada; la devolucion se registra como un
              movimiento relacionado.
            </p>
          </div>

          {entradaQuery.isLoading ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Cargando entrada...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Entrada
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{entrada?.numero ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tipo
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {entrada ? formatMovimientoLabel(entrada.tipoMovimiento) : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Estado
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {entrada ? formatMovimientoLabel(entrada.estado) : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Fecha
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatDate(entrada?.fechaMovimiento)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Proveedor
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {entrada?.proveedorRazonSocial ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Documento
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {entrada?.documentoReferencia ??
                    entrada?.comprobanteNumero ??
                    entrada?.guiaNumero ??
                    '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Almacen destino
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {entrada?.almacenDestinoNombre ?? entrada?.almacenDestinoCodigo ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pendiente
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatOptionalNumber(
                    cantidades.reduce(
                      (total, detalle) =>
                        total + Number(detalle.cantidadPendienteDevolver ?? 0),
                      0,
                    ),
                    { maximumFractionDigits: 4 },
                  )}
                </p>
              </div>
            </div>
          )}
        </Card>

        {!entradaQuery.isLoading && entrada ? (
          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            <Card className="p-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-950">
                  Datos de la devolucion
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete el motivo y datos documentales cuando corresponda.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Motivo</span>
                  <input className={inputClass} maxLength={150} type="text" {...register('motivo')} />
                  {errors.motivo ? (
                    <span className="mt-1 block text-sm text-red-600">
                      {errors.motivo.message}
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className={labelClass}>Numero nota de credito (opcional)</span>
                  <input
                    className={inputClass}
                    maxLength={50}
                    type="text"
                    {...register('numeroNotaCredito')}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Fecha nota de credito (opcional)</span>
                  <input className={inputClass} type="date" {...register('fechaDocumento')} />
                </label>
                <label className="block md:col-span-2">
                  <span className={labelClass}>Observacion (opcional)</span>
                  <textarea className={textareaClass} maxLength={500} {...register('observacion')} />
                  {errors.observacion ? (
                    <span className="mt-1 block text-sm text-red-600">
                      {errors.observacion.message}
                    </span>
                  ) : null}
                </label>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-950">Lineas a devolver</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seleccione las lineas y cantidades. El stock y la valorizacion los valida el
                  backend al guardar o confirmar.
                </p>
              </div>

              {errors.detalles?.message ? (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors.detalles.message}
                </div>
              ) : null}

              <DevolucionProveedorDetalleTable
                detalles={cantidades}
                errors={errors}
                register={register}
              />
            </Card>

            {!puedeRegistrar ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No se puede registrar una devolucion para esta entrada. Verifique que este
                confirmada, que tenga pendientes y que cuente con permisos.
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={createMutation.isPending}
                onClick={() => navigate('/inventario/movimientos')}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!puedeRegistrar || createMutation.isPending}
                onClick={handleSubmit((values) => guardar(values, false))}
                type="button"
              >
                <Save size={17} />
                {createMutation.isPending ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!puedeConfirmar || createMutation.isPending}
                onClick={handleSubmit((values) =>
                  setConfirmValues(devolucionProveedorSchema.parse(values)),
                )}
                title={!canConfirm ? 'No tiene permiso INVENTARIO_DEVOLUCION_CONFIRMAR' : undefined}
                type="button"
              >
                <ShieldCheck size={17} />
                Guardar y confirmar
              </button>
            </div>
          </form>
        ) : null}

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-950">
              Devoluciones al proveedor
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Historial relacionado con la entrada original.
            </p>
          </div>
          <DevolucionProveedorHistorialTable
            devoluciones={devoluciones}
            isLoading={devolucionesQuery.isLoading}
            onView={openView}
          />
        </Card>
      </div>

      <MovimientoViewModal
        isLoading={isViewLoading}
        isOpen={isViewOpen}
        movimiento={viewMovimiento}
        onClose={() => {
          setIsViewOpen(false)
          setViewMovimiento(null)
        }}
      />

      {confirmValues ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
              <h2 className="text-lg font-semibold">Confirmar devolucion</h2>
              <p className="mt-1 text-sm text-slate-300">
                La devolucion reducira el stock y generara kardex.
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm leading-6 text-slate-600">
                La entrada original permanecera confirmada. Espere la respuesta real del backend
                antes de continuar.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={createMutation.isPending}
                  onClick={() => setConfirmValues(null)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={createMutation.isPending}
                  onClick={() => guardar(confirmValues, true)}
                  type="button"
                >
                  {createMutation.isPending ? 'Confirmando...' : 'Guardar y confirmar'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
