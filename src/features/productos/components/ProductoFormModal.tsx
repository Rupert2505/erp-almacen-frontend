import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  familiaService,
  getFamiliaApiErrorMessage,
} from '../../familias/services/familiaService'
import type { Familia } from '../../familias/types/familia.types'
import { marcaService, getMarcaApiErrorMessage } from '../../marcas/services/marcaService'
import type { Marca } from '../../marcas/types/marca.types'
import {
  getSubfamiliaApiErrorMessage,
  subfamiliaService,
} from '../../subfamilias/services/subfamiliaService'
import type { Subfamilia } from '../../subfamilias/types/subfamilia.types'
import {
  getTipoArticuloApiErrorMessage,
  tipoArticuloService,
} from '../../tipos-articulo/services/tipoArticuloService'
import type { TipoArticulo } from '../../tipos-articulo/types/tipoArticulo.types'
import type { TipoArticuloFormValues } from '../../tipos-articulo/schemas/tipoArticuloSchema'
import {
  productoSchema,
  type ProductoFormInput,
  type ProductoFormValues,
} from '../schemas/productoSchema'
import type { Producto } from '../types/producto.types'
import type { UnidadMedida } from '../types/unidadMedida.types'
import { QuickCatalogModal, type QuickCatalogFormValues } from './QuickCatalogModal'
import { QuickTipoArticuloModal } from './QuickTipoArticuloModal'

type ProductoFormModalProps = {
  canCreateCatalogs: boolean
  errorMessage?: string | null
  familias: Familia[]
  isLoadingOptions: boolean
  isOpen: boolean
  isSaving: boolean
  marcas: Marca[]
  mode: 'create' | 'edit'
  producto?: Producto | null
  tiposArticulo: TipoArticulo[]
  unidadesMedida: UnidadMedida[]
  onClose: () => void
  onSubmit: (values: ProductoFormValues) => Promise<void>
}

type QuickCatalogType = 'familia' | 'subfamilia' | 'marca'

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const textareaClass =
  'min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: ProductoFormInput = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipoArticuloId: 0,
  familiaId: 0,
  subfamiliaId: null,
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
    tipoArticuloId: producto.tipoArticuloId,
    familiaId: producto.familiaId,
    subfamiliaId: producto.subfamiliaId ?? null,
    marcaId: producto.marcaId ?? null,
    unidadMedidaId: producto.unidadMedidaId,
    stockMinimo: producto.stockMinimo ?? undefined,
    stockMaximo: producto.stockMaximo ?? undefined,
    costoReferencial: producto.costoReferencial ?? undefined,
    controlaLote: producto.controlaLote,
    controlaSerie: producto.controlaSerie,
  }
}

function appendOrReplaceById<T extends { id: number }>(items: T[] | undefined, item: T) {
  const currentItems = items ?? []
  const exists = currentItems.some((currentItem) => currentItem.id === item.id)

  if (exists) {
    return currentItems.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
  }

  return [...currentItems, item]
}

function buildMarcaCodigo(nombre: string) {
  const codigo = nombre
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)

  return codigo || 'MARCA'
}

export function ProductoFormModal({
  canCreateCatalogs,
  errorMessage,
  familias,
  isLoadingOptions,
  isOpen,
  isSaving,
  marcas,
  mode,
  onClose,
  onSubmit,
  producto,
  tiposArticulo,
  unidadesMedida,
}: ProductoFormModalProps) {
  const queryClient = useQueryClient()
  const lastFamiliaId = useRef<number | null>(null)
  const [quickModal, setQuickModal] = useState<QuickCatalogType | null>(null)
  const [isQuickTipoOpen, setIsQuickTipoOpen] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    control,
  } = useForm<ProductoFormInput, unknown, ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues,
  })

  const watchedFamiliaId = useWatch({ control, name: 'familiaId' })
  const selectedFamiliaId = watchedFamiliaId ? Number(watchedFamiliaId) : 0
  const selectedFamilia = familias.find((familia) => familia.id === selectedFamiliaId) ?? null

  const subfamiliasQuery = useQuery({
    enabled: isOpen && selectedFamiliaId > 0,
    queryKey: ['subfamilias-por-familia', selectedFamiliaId],
    queryFn: () => subfamiliaService.getSubfamiliasPorFamilia(selectedFamiliaId),
  })

  const createFamiliaMutation = useMutation({
    mutationFn: (values: QuickCatalogFormValues) =>
      familiaService.createFamilia({
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || null,
      }),
    onSuccess: async (familia) => {
      queryClient.setQueryData<Familia[]>(['familias-activas'], (current) =>
        appendOrReplaceById(current, familia),
      )
      await queryClient.invalidateQueries({ queryKey: ['familias-activas'] })
      await queryClient.invalidateQueries({ queryKey: ['familias'] })
      setValue('familiaId', familia.id, { shouldDirty: true, shouldValidate: true })
      setValue('subfamiliaId', null, { shouldDirty: true, shouldValidate: true })
      setQuickModal(null)
      setQuickError(null)
      setQuickFeedback('Familia creada y seleccionada correctamente.')
    },
    onError: (error) => {
      setQuickError(getFamiliaApiErrorMessage(error))
    },
  })

  const createSubfamiliaMutation = useMutation({
    mutationFn: (values: QuickCatalogFormValues) => {
      if (selectedFamiliaId <= 0) {
        throw new Error('Seleccione una familia para crear una subfamilia.')
      }

      return subfamiliaService.createSubfamilia({
        familiaId: selectedFamiliaId,
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || null,
      })
    },
    onSuccess: async (subfamilia) => {
      queryClient.setQueryData<Subfamilia[]>(
        ['subfamilias-por-familia', selectedFamiliaId],
        (current) => appendOrReplaceById(current, subfamilia),
      )
      await queryClient.invalidateQueries({ queryKey: ['subfamilias-por-familia'] })
      await queryClient.invalidateQueries({ queryKey: ['subfamilias'] })
      await subfamiliasQuery.refetch()
      setValue('subfamiliaId', subfamilia.id, { shouldDirty: true, shouldValidate: true })
      setQuickModal(null)
      setQuickError(null)
      setQuickFeedback('Subfamilia creada y seleccionada correctamente.')
    },
    onError: (error) => {
      if (error instanceof Error && !('response' in error)) {
        setQuickError(error.message)
        return
      }

      setQuickError(getSubfamiliaApiErrorMessage(error))
    },
  })

  const createMarcaMutation = useMutation({
    mutationFn: (values: QuickCatalogFormValues) =>
      marcaService.createMarca({
        codigo: buildMarcaCodigo(values.nombre),
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || null,
      }),
    onSuccess: async (marca) => {
      queryClient.setQueryData<Marca[]>(['marcas-activas'], (current) =>
        appendOrReplaceById(current, marca),
      )
      await queryClient.invalidateQueries({ queryKey: ['marcas-activas'] })
      await queryClient.invalidateQueries({ queryKey: ['marcas'] })
      setValue('marcaId', marca.id, { shouldDirty: true, shouldValidate: true })
      setQuickModal(null)
      setQuickError(null)
      setQuickFeedback('Marca creada y seleccionada correctamente.')
    },
    onError: (error) => {
      setQuickError(getMarcaApiErrorMessage(error))
    },
  })

  const createTipoArticuloMutation = useMutation({
    mutationFn: (values: TipoArticuloFormValues) =>
      tipoArticuloService.createTipoArticulo({
        codigo: values.codigo.trim(),
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || null,
      }),
    onSuccess: async (tipoArticulo) => {
      queryClient.setQueryData<TipoArticulo[]>(['tipos-articulo-activos'], (current) =>
        appendOrReplaceById(current, tipoArticulo),
      )
      await queryClient.invalidateQueries({ queryKey: ['tipos-articulo-activos'] })
      await queryClient.invalidateQueries({ queryKey: ['tipos-articulo'] })
      setValue('tipoArticuloId', tipoArticulo.id, { shouldDirty: true, shouldValidate: true })
      setIsQuickTipoOpen(false)
      setQuickError(null)
      setQuickFeedback('Tipo de articulo creado y seleccionado correctamente.')
    },
    onError: (error) => {
      setQuickError(getTipoArticuloApiErrorMessage(error))
    },
  })

  const isQuickSaving =
    createFamiliaMutation.isPending ||
    createSubfamiliaMutation.isPending ||
    createMarcaMutation.isPending ||
    createTipoArticuloMutation.isPending

  useEffect(() => {
    if (isOpen) {
      lastFamiliaId.current = null
      reset(valuesFromProducto(producto))
    }
  }, [isOpen, producto, reset])

  useEffect(() => {
    if (!isOpen) {
      lastFamiliaId.current = null
      return
    }

    const nextFamiliaId = selectedFamiliaId || null

    if (lastFamiliaId.current === null) {
      lastFamiliaId.current = nextFamiliaId
      return
    }

    if (lastFamiliaId.current !== nextFamiliaId) {
      setValue('subfamiliaId', null, { shouldDirty: true, shouldValidate: true })
      lastFamiliaId.current = nextFamiliaId
    }
  }, [isOpen, selectedFamiliaId, setValue])

  if (!isOpen) {
    return null
  }

  const subfamilias = subfamiliasQuery.data ?? []

  const openQuickModal = (type: QuickCatalogType) => {
    setQuickError(null)
    setQuickFeedback(null)
    setQuickModal(type)
  }

  const openQuickTipoArticuloModal = () => {
    setQuickError(null)
    setQuickFeedback(null)
    setIsQuickTipoOpen(true)
  }

  const closeQuickModal = () => {
    if (isQuickSaving) {
      return
    }

    setQuickModal(null)
    setIsQuickTipoOpen(false)
    setQuickError(null)
  }

  const handleQuickSubmit = async (values: QuickCatalogFormValues) => {
    if (quickModal === 'familia') {
      await createFamiliaMutation.mutateAsync(values)
      return
    }

    if (quickModal === 'subfamilia') {
      await createSubfamiliaMutation.mutateAsync(values)
      return
    }

    if (quickModal === 'marca') {
      await createMarcaMutation.mutateAsync(values)
    }
  }

  const handleQuickTipoSubmit = async (values: TipoArticuloFormValues) => {
    await createTipoArticuloMutation.mutateAsync(values)
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

          {quickFeedback ? (
            <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {quickFeedback}
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

            <div className="block">
              <span className={labelClass}>Familia</span>
              <div className="flex gap-2">
                <select className={inputClass} disabled={isLoadingOptions} {...register('familiaId')}>
                  <option value="">Seleccione una familia</option>
                  {familias.map((familia) => (
                    <option key={familia.id} value={familia.id}>
                      {familia.nombre}
                    </option>
                  ))}
                </select>
                {canCreateCatalogs ? (
                  <button
                    aria-label="Nueva familia"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={() => openQuickModal('familia')}
                    title="Nueva familia"
                    type="button"
                  >
                    <Plus size={18} />
                  </button>
                ) : null}
              </div>
              {errors.familiaId ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.familiaId.message}
                </span>
              ) : null}
            </div>

            <div className="block">
              <span className={labelClass}>Subfamilia</span>
              <div className="flex gap-2">
                <select
                  className={inputClass}
                  disabled={selectedFamiliaId <= 0 || subfamiliasQuery.isLoading}
                  {...register('subfamiliaId')}
                >
                  <option value="">Sin subfamilia</option>
                  {subfamilias.map((subfamilia) => (
                    <option key={subfamilia.id} value={subfamilia.id}>
                      {subfamilia.nombre}
                    </option>
                  ))}
                </select>
                {canCreateCatalogs ? (
                  <button
                    aria-label="Nueva subfamilia"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedFamiliaId <= 0}
                    onClick={() => openQuickModal('subfamilia')}
                    title={
                      selectedFamiliaId > 0
                        ? 'Nueva subfamilia'
                        : 'Selecciona una familia para crear una subfamilia'
                    }
                    type="button"
                  >
                    <Plus size={18} />
                  </button>
                ) : null}
              </div>
              {selectedFamiliaId <= 0 && canCreateCatalogs ? (
                <span className="mt-1 block text-xs text-slate-500">
                  Selecciona una familia para crear una subfamilia.
                </span>
              ) : null}
              {errors.subfamiliaId ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.subfamiliaId.message}
                </span>
              ) : null}
            </div>

            <div className="block">
              <span className={labelClass}>Marca</span>
              <div className="flex gap-2">
                <select className={inputClass} disabled={isLoadingOptions} {...register('marcaId')}>
                  <option value="">Sin marca</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
                {canCreateCatalogs ? (
                  <button
                    aria-label="Nueva marca"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={() => openQuickModal('marca')}
                    title="Nueva marca"
                    type="button"
                  >
                    <Plus size={18} />
                  </button>
                ) : null}
              </div>
              {errors.marcaId ? (
                <span className="mt-1 block text-sm text-red-600">{errors.marcaId.message}</span>
              ) : null}
            </div>

            <div className="block">
              <span className={labelClass}>Tipo de articulo</span>
              <div className="flex gap-2">
                <select
                  className={inputClass}
                  disabled={isLoadingOptions}
                  {...register('tipoArticuloId')}
                >
                  <option value="">Seleccione un tipo</option>
                  {tiposArticulo.map((tipoArticulo) => (
                    <option key={tipoArticulo.id} value={tipoArticulo.id}>
                      {tipoArticulo.nombre}
                    </option>
                  ))}
                </select>
                {canCreateCatalogs ? (
                  <button
                    aria-label="Nuevo tipo de articulo"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={openQuickTipoArticuloModal}
                    title="Nuevo tipo de articulo"
                    type="button"
                  >
                    <Plus size={18} />
                  </button>
                ) : null}
              </div>
              {errors.tipoArticuloId ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.tipoArticuloId.message}
                </span>
              ) : null}
            </div>

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
              <input
                className={inputClass}
                min="0"
                step="0.01"
                type="number"
                {...register('costoReferencial')}
              />
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

      <QuickCatalogModal
        errorMessage={quickError}
        helperText={
          quickModal === 'subfamilia'
            ? 'La subfamilia se asociara a la familia seleccionada.'
            : 'Complete los datos del catalogo.'
        }
        isOpen={quickModal !== null}
        isSaving={isQuickSaving}
        onClose={closeQuickModal}
        onSubmit={handleQuickSubmit}
        readonlyLabel={quickModal === 'subfamilia' ? 'Familia' : undefined}
        readonlyValue={quickModal === 'subfamilia' ? selectedFamilia?.nombre : undefined}
        title={
          quickModal === 'familia'
            ? 'Nueva familia'
            : quickModal === 'subfamilia'
              ? 'Nueva subfamilia'
              : 'Nueva marca'
        }
      />
      <QuickTipoArticuloModal
        errorMessage={quickError}
        isOpen={isQuickTipoOpen}
        isSaving={createTipoArticuloMutation.isPending}
        onClose={closeQuickModal}
        onSubmit={handleQuickTipoSubmit}
      />
    </div>
  )
}
