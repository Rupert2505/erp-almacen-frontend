import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import {
  formatOptionalCurrency,
  formatOptionalNumber,
  toFiniteNumber,
} from '../../../../shared/utils/numberFormat'
import type { MovimientoDetalle } from '../types/movimiento.types'

type MovimientoValorizacionComercialProps = {
  detalles: MovimientoDetalle[]
}

const quantityOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
} satisfies Intl.NumberFormatOptions

const percentOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
} satisfies Intl.NumberFormatOptions

function formatPercent(value?: number | null) {
  const formatted = formatOptionalNumber(value, percentOptions)
  return formatted === '-' ? formatted : `${formatted}%`
}

function sumSnapshot(
  detalles: MovimientoDetalle[],
  select: (detalle: MovimientoDetalle) => number | null | undefined,
) {
  if (detalles.length === 0) {
    return null
  }

  const values = detalles.map((detalle) => toFiniteNumber(select(detalle)))
  if (values.some((value) => value === null)) {
    return null
  }

  return (values as number[]).reduce((total, value) => total + value, 0)
}

function isNegative(value?: number | null) {
  const numberValue = toFiniteNumber(value)
  return numberValue !== null && numberValue < 0
}

function differenceAppearance(value?: number | null) {
  const numberValue = toFiniteNumber(value)

  if (numberValue === null || numberValue === 0) {
    return {
      ariaLabel: 'Diferencia comercial neutra',
      containerClass: 'border-slate-200 bg-slate-50',
      labelClass: 'text-slate-500',
      valueClass: 'text-slate-900',
    }
  }

  if (numberValue > 0) {
    return {
      ariaLabel: 'Diferencia comercial positiva',
      containerClass: 'border-blue-200 bg-blue-50',
      labelClass: 'text-blue-700',
      valueClass: 'text-blue-800',
    }
  }

  return {
    ariaLabel: 'Diferencia comercial negativa',
    containerClass: 'border-red-200 bg-red-50',
    labelClass: 'text-red-700',
    valueClass: 'text-red-800',
  }
}

function Metric({
  ariaLabel,
  className = '',
  label,
  labelClassName = 'text-slate-500',
  title,
  value,
  valueClassName = 'text-slate-900',
}: {
  ariaLabel?: string
  className?: string
  label: string
  labelClassName?: string
  title?: string
  value: string
  valueClassName?: string
}) {
  return (
    <div aria-label={ariaLabel} className={`min-w-0 ${className}`} title={title}>
      <p
        className={`min-h-8 text-xs font-semibold uppercase leading-4 tracking-wide ${labelClassName}`}
      >
        {label}
      </p>
      <p className={`mt-2 text-base font-bold leading-none ${valueClassName}`}>{value}</p>
    </div>
  )
}

function DifferenceMetric({
  className = '',
  value,
}: {
  className?: string
  value?: number | null
}) {
  const appearance = differenceAppearance(value)

  return (
    <Metric
      ariaLabel={appearance.ariaLabel}
      className={`rounded-md border px-3 py-3 ${appearance.containerClass} ${className}`}
      label="Diferencia comercial"
      labelClassName={appearance.labelClass}
      value={formatOptionalCurrency(value)}
      valueClassName={appearance.valueClass}
    />
  )
}

export function MovimientoValorizacionComercial({
  detalles,
}: MovimientoValorizacionComercialProps) {
  const resumen = {
    costoInventario: sumSnapshot(detalles, (detalle) => detalle.costoInventarioTotal),
    diferencia: sumSnapshot(detalles, (detalle) => detalle.diferenciaComercialSinIgv),
    igv: sumSnapshot(detalles, (detalle) => detalle.igvTotal),
    precio: sumSnapshot(detalles, (detalle) => detalle.precioVentaTotalConIgv),
    valorSinIgv: sumSnapshot(detalles, (detalle) => detalle.valorVentaTotalSinIgv),
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-950">Resumen de la salida de venta</h3>
          <p className="mt-1 text-sm text-slate-600">
            Inventario y valorización comercial se muestran por separado.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric
            ariaLabel="Costo total inventario destacado"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 shadow-sm"
            label="Costo total inventario"
            labelClassName="text-amber-700"
            title="Costo histórico determinado por el motor de inventario. Se muestra únicamente para análisis."
            value={formatOptionalCurrency(resumen.costoInventario)}
            valueClassName="text-amber-900"
          />
          <Metric
            className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm"
            label="Valor total sin IGV"
            value={formatOptionalCurrency(resumen.valorSinIgv)}
          />
          <Metric
            className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm"
            label="IGV total"
            value={formatOptionalCurrency(resumen.igv)}
          />
          <Metric
            ariaLabel="Precio total con IGV destacado"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 shadow-sm"
            label="Precio total con IGV"
            labelClassName="text-emerald-700"
            value={formatOptionalCurrency(resumen.precio)}
            valueClassName="text-emerald-900"
          />
          <DifferenceMetric className="shadow-sm" value={resumen.diferencia} />
        </div>
      </div>

      {detalles.length === 0 ? (
        <div className="rounded-lg border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          Sin detalles.
        </div>
      ) : null}

      {detalles.map((detalle) => {
        const negativeDifference = isNegative(detalle.diferenciaComercialSinIgv)

        return (
          <article
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            key={detalle.id}
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 px-4 pt-4 sm:pb-4">
                {detalle.productoCodigo ? <ProductCodeBadge code={detalle.productoCodigo} /> : null}
                <p className="font-semibold text-slate-950">{detalle.productoNombre ?? '-'}</p>
                <p className="text-xs text-slate-500">
                  Origen: {detalle.ubicacionOrigenCodigo ?? '-'} · Observación:{' '}
                  {detalle.observacion ?? '-'}
                </p>
              </div>
              <div className="mx-4 mb-4 min-w-28 rounded-md bg-slate-100 px-3 py-2 text-left sm:mt-4 sm:text-right">
                <p className="text-xs font-semibold uppercase text-slate-500">Cantidad</p>
                <p className="mt-1 text-lg font-bold leading-none text-slate-950">
                  {formatOptionalNumber(detalle.cantidad, quantityOptions)}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50/80">
                <div className="border-b border-slate-200 px-4 py-2.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Inventario
                  </p>
                </div>
                <div className="grid gap-3 p-3 sm:grid-cols-2">
                  <Metric
                    className="rounded-md border border-slate-200 bg-white px-3 py-3"
                    label="Costo de inventario"
                    title="Costo histórico determinado por el motor de inventario. Se muestra únicamente para análisis."
                    value={formatOptionalCurrency(detalle.costoInventarioUnitario)}
                  />
                  <Metric
                    ariaLabel="Costo total inventario destacado"
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3"
                    label="Costo total inventario"
                    labelClassName="text-amber-700"
                    value={formatOptionalCurrency(detalle.costoInventarioTotal)}
                    valueClassName="text-amber-900"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-sky-200 bg-sky-50/50">
                <div className="border-b border-sky-200 bg-sky-50 px-4 py-2.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-800">
                    Comercial
                  </p>
                </div>
                <div className="space-y-5 p-3 sm:p-4">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cálculo por unidad
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <Metric
                        className="rounded-md border border-sky-100 bg-white px-3 py-3"
                        label="Costo base comercial sin IGV"
                        value={formatOptionalCurrency(detalle.costoBaseComercialSinIgv)}
                      />
                      <Metric
                        className="rounded-md border border-sky-100 bg-white px-3 py-3"
                        label="Recargo comercial"
                        value={formatPercent(detalle.recargoComercialPct)}
                      />
                      <Metric
                        className="rounded-md border border-sky-100 bg-white px-3 py-3"
                        label="Valor venta unitario sin IGV"
                        value={formatOptionalCurrency(detalle.valorVentaUnitarioSinIgv)}
                      />
                      <Metric
                        className="rounded-md border border-sky-100 bg-white px-3 py-3"
                        label="IGV unitario"
                        value={formatOptionalCurrency(detalle.igvUnitario)}
                      />
                      <Metric
                        className="rounded-md border border-sky-100 bg-white px-3 py-3"
                        label="Precio unitario con IGV"
                        value={formatOptionalCurrency(detalle.precioVentaUnitarioConIgv)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-sky-200 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Totales del detalle
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Metric
                        className="rounded-md border border-sky-100 bg-white px-3 py-3"
                        label="Valor total sin IGV"
                        value={formatOptionalCurrency(detalle.valorVentaTotalSinIgv)}
                      />
                      <Metric
                        className="rounded-md border border-sky-100 bg-white px-3 py-3"
                        label="IGV total"
                        value={formatOptionalCurrency(detalle.igvTotal)}
                      />
                      <Metric
                        ariaLabel="Precio total con IGV destacado"
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3"
                        label="Precio total con IGV"
                        labelClassName="text-emerald-700"
                        value={formatOptionalCurrency(detalle.precioVentaTotalConIgv)}
                        valueClassName="text-emerald-900"
                      />
                      <DifferenceMetric value={detalle.diferenciaComercialSinIgv} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {negativeDifference ? (
              <p className="mx-4 mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                El valor comercial es inferior al costo de inventario.
              </p>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}
