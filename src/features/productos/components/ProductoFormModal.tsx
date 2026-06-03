import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  productoSchema,
  type ProductoFormInput,
  type ProductoFormValues,
} from '../schemas/productoSchema'
import type { Categoria } from '../types/categoria.types'
import type { Marca } from '../types/marca.types'
import type { Producto } from '../types/producto.types'
import type { UnidadMedida } from '../types/unidadMedida.types'

type ProductoFormModalProps = {
  categorias: Categoria[]
  errorMessage?: string | null
  isLoadingOptions: boolean
  isOpen: boolean
  isSaving: boolean
  marcas: Marca[]
  mode: 'create' | 'edit'
  producto?: Producto | null
  unidadesMedida: UnidadMedida[]
  onClose: () => void
  onSubmit: (values: ProductoFormValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const textareaClass =
  'min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: ProductoFormInput = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoriaId: null,
  marcaId: null,
  unidadMedidaId: 0,
  stockMinimo: undefined,
  stockMaximo: undefined,
  costoReferencial: undefined,
  controlaLote: false,
  controlaSerie: false,
}

function valuesFromProducto(producto?: Producto | null): ProductoFormInput {
  if (!producto) {
    return defaultValues
  }

  return {
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? '',
    categoriaId: producto.categoriaId ?? null,
    marcaId: producto.marcaId ?? null,
    unidadMedidaId: producto.unidadMedidaId,
    stockMinimo: producto.stockMinimo ?? undefined,
    stockMaximo: producto.stockMaximo ?? undefined,
    costoReferencial: producto.costoReferencial ?? undefined,
    controlaLote: producto.controlaLote,
    controlaSerie: producto.controlaSerie,
  }
}

export function ProductoFormModal({
  categorias,
  errorMessage,
  isLoadingOptions,
  isOpen,
  isSaving,
  marcas,
  mode,
  onClose,
  onSubmit,
  producto,
  unidadesMedida,
}: ProductoFormModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProductoFormInput, unknown, ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset(valuesFromProducto(producto))
    }
  }, [isOpen, producto, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {mode === 'create' ? 'Nuevo producto' : 'Editar producto'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete los datos generales del producto.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form className="overflow-y-auto px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
          {errorMessage ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Codigo</span>
              <input className={inputClass} {...register('codigo')} />
              {errors.codigo ? (
                <span className="mt-1 block text-sm text-red-600">{errors.codigo.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Nombre</span>
              <input className={inputClass} {...register('nombre')} />
              {errors.nombre ? (
                <span className="mt-1 block text-sm text-red-600">{errors.nombre.message}</span>
              ) : null}
            </label>

            <label className="block md:col-span-2">
              <span className={labelClass}>Descripcion</span>
              <textarea className={textareaClass} {...register('descripcion')} />
              {errors.descripcion ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.descripcion.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Categoria</span>
              <select className={inputClass} disabled={isLoadingOptions} {...register('categoriaId')}>
                <option value="">Sin categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
              {errors.categoriaId ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.categoriaId.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Marca</span>
              <select className={inputClass} disabled={isLoadingOptions} {...register('marcaId')}>
                <option value="">Sin marca</option>
                {marcas.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
              {errors.marcaId ? (
                <span className="mt-1 block text-sm text-red-600">{errors.marcaId.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Unidad de medida</span>
              <select
                className={inputClass}
                disabled={isLoadingOptions}
                {...register('unidadMedidaId')}
              >
                <option value="">Seleccione una unidad</option>
                {unidadesMedida.map((unidad) => (
                  <option key={unidad.id} value={unidad.id}>
                    {unidad.nombre} ({unidad.abreviatura})
                  </option>
                ))}
              </select>
              {errors.unidadMedidaId ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.unidadMedidaId.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Costo referencial</span>
              <input className={inputClass} min="0" step="0.01" type="number" {...register('costoReferencial')} />
              {errors.costoReferencial ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.costoReferencial.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Stock minimo</span>
              <input className={inputClass} min="0" step="1" type="number" {...register('stockMinimo')} />
              {errors.stockMinimo ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.stockMinimo.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Stock maximo</span>
              <input className={inputClass} min="0" step="1" type="number" {...register('stockMaximo')} />
              {errors.stockMaximo ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.stockMaximo.message}
                </span>
              ) : null}
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3">
              <input
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                type="checkbox"
                {...register('controlaLote')}
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">Controla lote</span>
                <span className="block text-xs text-slate-500">Seguimiento por lote.</span>
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3">
              <input
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                type="checkbox"
                {...register('controlaSerie')}
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">Controla serie</span>
                <span className="block text-xs text-slate-500">Seguimiento por numero de serie.</span>
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
