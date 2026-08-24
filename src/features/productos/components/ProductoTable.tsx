import { CheckCircle2, Edit, PowerOff } from 'lucide-react'
import { ProductCodeBadge } from '../../../shared/components/ProductCodeBadge'
import { formatOptionalCurrency } from '../../../shared/utils/numberFormat'
import type { Producto } from '../types/producto.types'

type ProductoTableProps = {
  productos: Producto[]
  canEdit: boolean
  canToggle: boolean
  isLoading: boolean
  toggleLoadingId?: number | null
  onActivar: (producto: Producto) => void
  onDesactivar: (producto: Producto) => void
  onEdit: (producto: Producto) => void
}

function formatNumber(value?: number | null) {
  return value === null || value === undefined ? '-' : value.toString()
}

export function ProductoTable({
  canEdit,
  canToggle,
  isLoading,
  onActivar,
  onDesactivar,
  onEdit,
  productos,
  toggleLoadingId,
}: ProductoTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Familia</th>
              <th className="px-4 py-3">Subfamilia</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Tipo de articulo</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-right">Stock minimo</th>
              <th className="px-4 py-3 text-right">Stock maximo</th>
              <th
                className="px-4 py-3 text-right"
                title="Base manual utilizada para calcular el valor comercial de materiales en salidas de venta. No modifica el costo promedio del inventario."
              >
                Costo base comercial sin IGV
              </th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={11}>
                  Cargando productos...
                </td>
              </tr>
            ) : null}

            {!isLoading && productos.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={11}>
                  No se encontraron productos.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? productos.map((producto) => {
                  const isToggleLoading = toggleLoadingId === producto.id

                  return (
                    <tr className="hover:bg-cyan-50/40" key={producto.id}>
                      <td className="min-w-72 px-4 py-3">
                        <div className="space-y-1">
                          <ProductCodeBadge code={producto.codigo} />
                          <p className="font-medium leading-5 text-slate-950">{producto.nombre}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {producto.familiaNombre ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {producto.subfamiliaNombre ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {producto.marcaNombre ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {producto.tipoArticuloNombre ?? producto.tipoArticuloCodigo ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {producto.unidadMedidaAbreviatura ?? producto.unidadMedidaNombre ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {formatNumber(producto.stockMinimo)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {formatNumber(producto.stockMaximo)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                        {formatOptionalCurrency(producto.costoReferencial)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            producto.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canEdit ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                              onClick={() => onEdit(producto)}
                              type="button"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                          ) : null}

                          {canToggle && producto.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={() => onDesactivar(producto)}
                              type="button"
                            >
                              <PowerOff size={16} />
                              Desactivar
                            </button>
                          ) : null}

                          {canToggle && !producto.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={() => onActivar(producto)}
                              type="button"
                            >
                              <CheckCircle2 size={16} />
                              Activar
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
