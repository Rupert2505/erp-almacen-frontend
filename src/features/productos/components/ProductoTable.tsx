import { CheckCircle2, Edit, PowerOff } from 'lucide-react'
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

const moneyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

function formatNumber(value?: number | null) {
  return value === null || value === undefined ? '-' : value.toString()
}

function formatMoney(value?: number | null) {
  return value === null || value === undefined ? '-' : moneyFormatter.format(value)
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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Codigo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-right">Stock minimo</th>
              <th className="px-4 py-3 text-right">Stock maximo</th>
              <th className="px-4 py-3 text-right">Costo referencial</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={10}>
                  Cargando productos...
                </td>
              </tr>
            ) : null}

            {!isLoading && productos.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={10}>
                  No se encontraron productos.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? productos.map((producto) => {
                  const isToggleLoading = toggleLoadingId === producto.id

                  return (
                    <tr className="hover:bg-slate-50" key={producto.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {producto.codigo}
                      </td>
                      <td className="min-w-56 px-4 py-3 text-slate-900">{producto.nombre}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {producto.categoriaNombre ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {producto.marcaNombre ?? '-'}
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
                        {formatMoney(producto.costoReferencial)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            producto.activo
                              ? 'bg-emerald-50 text-emerald-700'
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
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
