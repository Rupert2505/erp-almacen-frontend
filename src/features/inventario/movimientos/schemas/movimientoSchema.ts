import { z } from 'zod'
import { TIPOS_MOVIMIENTO } from '../types/movimiento.types'

const TIPOS_COMPROBANTE = ['FACTURA', 'BOLETA', 'OTRO'] as const

const requiredId = (message: string) =>
  z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined
      }

      return Number(value)
    },
    z.number('Seleccione una opcion valida').min(1, message),
  )

const optionalId = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return Number(value)
}, z.number('Seleccione una opcion valida').nullable())

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z.number('Ingrese un numero valido').finite('Ingrese un numero valido').min(0, 'No puede ser negativo').optional())

const optionalCommercialSurcharge = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z
  .number('Ingrese un recargo comercial valido')
  .finite('Ingrese un recargo comercial valido')
  .min(0, 'El recargo comercial debe ser mayor o igual a 0%')
  .max(1000, 'El recargo comercial no puede superar 1000%')
  .optional())

const positiveNumber = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z
    .number('Ingrese un numero valido')
    .finite('Ingrese un numero valido')
    .positive('La cantidad debe ser mayor a 0'),
)

const optionalComprobanteTipo = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return value
}, z.enum(TIPOS_COMPROBANTE).optional())

export const movimientoDetalleSchema = z.object({
  productoId: requiredId('Seleccione un producto'),
  ubicacionOrigenId: optionalId,
  ubicacionDestinoId: optionalId,
  cantidad: positiveNumber,
  costoUnitario: optionalNumber,
  valorUnitarioSinIgv: optionalNumber,
  tasaIgv: optionalNumber,
  costoBaseComercialSinIgv: optionalNumber,
  recargoComercialPct: optionalCommercialSurcharge,
  igvRecuperable: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return value
  }, z.boolean().optional()),
  observacion: z.string().trim().optional(),
})

export const movimientoSchema = z
  .object({
    tipoMovimiento: z.enum(TIPOS_MOVIMIENTO, 'Seleccione un tipo de movimiento'),
    proveedorId: optionalId,
    almacenOrigenId: optionalId,
    almacenDestinoId: optionalId,
    documentoReferencia: z.string().trim().optional(),
    motivoMovimiento: z.string().trim().optional(),
    ordenTrabajo: z.string().trim().optional(),
    areaSolicitante: z.string().trim().optional(),
    solicitante: z.string().trim().optional(),
    personalRetiraId: optionalId,
    responsableEntrega: z.string().trim().optional(),
    responsableRecepcion: z.string().trim().optional(),
    guiaSerie: z.string().trim().optional(),
    guiaNumero: z.string().trim().optional(),
    guiaFecha: z.string().trim().optional(),
    comprobanteTipo: optionalComprobanteTipo,
    comprobanteSerie: z.string().trim().optional(),
    comprobanteNumero: z.string().trim().optional(),
    comprobanteFechaEmision: z.string().trim().optional(),
    ordenCompraNumero: z.string().trim().optional(),
    fechaPedido: z.string().trim().optional(),
    fechaRecepcion: z.string().trim().optional(),
    flete: optionalNumber,
    movilidad: optionalNumber,
    otrosGastos: optionalNumber,
    observacionDocumentaria: z.string().trim().optional(),
    observacion: z.string().trim().optional(),
    confirmar: z.boolean().default(false),
    detalles: z.array(movimientoDetalleSchema).min(1, 'Agregue al menos un detalle'),
  })
  .superRefine((values, context) => {
    const requireProveedor = values.tipoMovimiento === 'ENTRADA_COMPRA'
    const requireMotivo = [
      'ENTRADA_AJUSTE',
      'SALIDA_CONSUMO',
      'SALIDA_AJUSTE',
      'AJUSTE_POSITIVO',
      'AJUSTE_NEGATIVO',
    ].includes(values.tipoMovimiento)
    const requirePersonalRetira = ['SALIDA_CONSUMO', 'SALIDA_VENTA'].includes(
      values.tipoMovimiento,
    )
    const requireDestino = [
      'ENTRADA_COMPRA',
      'ENTRADA_AJUSTE',
      'AJUSTE_POSITIVO',
      'TRANSFERENCIA',
    ].includes(values.tipoMovimiento)
    const requireOrigen = [
      'SALIDA_CONSUMO',
      'SALIDA_VENTA',
      'SALIDA_AJUSTE',
      'AJUSTE_NEGATIVO',
      'TRANSFERENCIA',
    ].includes(values.tipoMovimiento)

    if (requireProveedor && !values.proveedorId) {
      context.addIssue({
        code: 'custom',
        message: 'Seleccione un proveedor',
        path: ['proveedorId'],
      })
    }

    if (requireMotivo && !values.motivoMovimiento?.trim()) {
      context.addIssue({
        code: 'custom',
        message: 'Ingrese el motivo del movimiento',
        path: ['motivoMovimiento'],
      })
    }

    if (requirePersonalRetira && !values.personalRetiraId) {
      context.addIssue({
        code: 'custom',
        message: 'Seleccione el personal que retira o solicita',
        path: ['personalRetiraId'],
      })
    }

    if (requireOrigen && !values.almacenOrigenId) {
      context.addIssue({
        code: 'custom',
        message: 'Seleccione un almacen origen',
        path: ['almacenOrigenId'],
      })
    }

    if (requireDestino && !values.almacenDestinoId) {
      context.addIssue({
        code: 'custom',
        message: 'Seleccione un almacen destino',
        path: ['almacenDestinoId'],
      })
    }

    if (
      values.tipoMovimiento === 'TRANSFERENCIA' &&
      values.almacenOrigenId &&
      values.almacenDestinoId &&
      values.almacenOrigenId === values.almacenDestinoId
    ) {
      context.addIssue({
        code: 'custom',
        message: 'El almacen destino debe ser diferente al almacen origen',
        path: ['almacenDestinoId'],
      })
    }

    if (
      values.fechaPedido &&
      values.fechaRecepcion &&
      new Date(values.fechaRecepcion) < new Date(values.fechaPedido)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'La fecha de recepcion no puede ser menor que la fecha de pedido',
        path: ['fechaRecepcion'],
      })
    }

    if (values.tipoMovimiento === 'ENTRADA_COMPRA' && !values.fechaRecepcion) {
      context.addIssue({
        code: 'custom',
        message: 'Ingrese la fecha de recepcion',
        path: ['fechaRecepcion'],
      })
    }

    if (values.guiaSerie && !values.guiaNumero) {
      context.addIssue({
        code: 'custom',
        message: 'Ingrese el numero de guia',
        path: ['guiaNumero'],
      })
    }

    if (!values.guiaSerie && values.guiaNumero) {
      context.addIssue({
        code: 'custom',
        message: 'Ingrese la serie de guia',
        path: ['guiaSerie'],
      })
    }

    if (values.comprobanteSerie && !values.comprobanteNumero) {
      context.addIssue({
        code: 'custom',
        message: 'Ingrese el numero de comprobante',
        path: ['comprobanteNumero'],
      })
    }

    if (!values.comprobanteSerie && values.comprobanteNumero) {
      context.addIssue({
        code: 'custom',
        message: 'Ingrese la serie de comprobante',
        path: ['comprobanteSerie'],
      })
    }

    if (values.tipoMovimiento === 'ENTRADA_COMPRA') {
      values.detalles.forEach((detalle, index) => {
        if (
          detalle.valorUnitarioSinIgv === undefined ||
          detalle.valorUnitarioSinIgv === null
        ) {
          context.addIssue({
            code: 'custom',
            message: 'Ingrese el costo de compra unitario sin IGV',
            path: ['detalles', index, 'valorUnitarioSinIgv'],
          })
        }

        if (detalle.tasaIgv === undefined || detalle.tasaIgv === null) {
          context.addIssue({
            code: 'custom',
            message: 'Ingrese la tasa de IGV',
            path: ['detalles', index, 'tasaIgv'],
          })
        }
      })
    }

    if (values.tipoMovimiento === 'SALIDA_VENTA') {
      if (!values.ordenTrabajo?.trim()) {
        context.addIssue({
          code: 'custom',
          message: 'Ingrese la Orden de Servicio (OS)',
          path: ['ordenTrabajo'],
        })
      }

      if (values.confirmar) {
        values.detalles.forEach((detalle, index) => {
          if (
            detalle.costoBaseComercialSinIgv === undefined ||
            detalle.costoBaseComercialSinIgv === null
          ) {
            context.addIssue({
              code: 'custom',
              message: 'El producto no tiene costo base comercial sin IGV',
              path: ['detalles', index, 'costoBaseComercialSinIgv'],
            })
          }

          if (detalle.recargoComercialPct === undefined || detalle.recargoComercialPct === null) {
            context.addIssue({
              code: 'custom',
              message: 'Seleccione o ingrese el recargo comercial',
              path: ['detalles', index, 'recargoComercialPct'],
            })
          }
        })
      }
    }
  })

export const anularMovimientoSchema = z.object({
  motivo: z.string().trim().min(1, 'Ingrese el motivo de anulacion'),
})

export const cancelarMovimientoSchema = z.object({
  motivoCancelacion: z.string().trim().min(1, 'Ingrese el motivo de cancelacion'),
})

export type MovimientoFormInput = z.input<typeof movimientoSchema>
export type MovimientoFormValues = z.infer<typeof movimientoSchema>
export type AnularMovimientoValues = z.infer<typeof anularMovimientoSchema>
export type CancelarMovimientoValues = z.infer<typeof cancelarMovimientoSchema>
export type ComprobanteTipo = (typeof TIPOS_COMPROBANTE)[number]
