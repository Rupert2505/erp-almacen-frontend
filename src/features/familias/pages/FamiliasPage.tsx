import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { can } from '../../../shared/utils/permissions'
import {
  normalizeBusinessText,
  normalizeOptionalBusinessText,
} from '../../../shared/utils/textNormalization'
import { useAuth } from '../../auth/context/useAuth'
import { SubfamiliaFormModal } from '../../subfamilias/components/SubfamiliaFormModal'
import { SubfamiliaTable } from '../../subfamilias/components/SubfamiliaTable'
import type { SubfamiliaFormValues } from '../../subfamilias/schemas/subfamiliaSchema'
import {
  getSubfamiliaApiErrorMessage,
  subfamiliaService,
} from '../../subfamilias/services/subfamiliaService'
import type { Subfamilia, SubfamiliaPayload } from '../../subfamilias/types/subfamilia.types'
import { FamiliaFilters, type EstadoFamiliaFilter } from '../components/FamiliaFilters'
import { FamiliaFormModal } from '../components/FamiliaFormModal'
import { FamiliaTable } from '../components/FamiliaTable'
import type { FamiliaFormValues } from '../schemas/familiaSchema'
import { familiaService, getFamiliaApiErrorMessage } from '../services/familiaService'
import type { Familia, FamiliaPayload } from '../types/familia.types'

const PAGE_SIZE = 10
const SUBFAMILIA_PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type EstadoSubfamiliaFilter = 'todos' | 'activos' | 'inactivos'

type ConfirmAction =
  | {
      scope: 'familia'
      type: 'activar' | 'desactivar'
      familia: Familia
    }
  | {
      scope: 'subfamilia'
      type: 'activar' | 'desactivar'
      subfamilia: Subfamilia
    }

function getActivoFamiliaFilter(estado: EstadoFamiliaFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function getActivoSubfamiliaFilter(estado: EstadoSubfamiliaFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toFamiliaPayload(values: FamiliaFormValues): FamiliaPayload {
  return {
    nombre: normalizeBusinessText(values.nombre),
    prefijo: normalizeBusinessText(values.prefijo),
    descripcion: normalizeOptionalBusinessText(values.descripcion),
  }
}

function toSubfamiliaPayload(values: SubfamiliaFormValues): SubfamiliaPayload {
  return {
    familiaId: values.familiaId,
    nombre: normalizeBusinessText(values.nombre),
    descripcion: normalizeOptionalBusinessText(values.descripcion),
  }
}

function filterSubfamilias(
  subfamilias: Subfamilia[],
  texto: string,
  estado: EstadoSubfamiliaFilter,
) {
  const text = texto.trim().toLowerCase()
  const activo = getActivoSubfamiliaFilter(estado)

  return subfamilias.filter((subfamilia) => {
    const matchesEstado = activo === undefined || subfamilia.activo === activo
    const matchesText =
      !text ||
      subfamilia.nombre.toLowerCase().includes(text) ||
      (subfamilia.descripcion ?? '').toLowerCase().includes(text)

    return matchesEstado && matchesText
  })
}

export function FamiliasPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoFamiliaFilter>('todos')
  const [page, setPage] = useState(0)
  const [selectedFamilia, setSelectedFamilia] = useState<Familia | null>(null)
  const [subTexto, setSubTexto] = useState('')
  const [subEstado, setSubEstado] = useState<EstadoSubfamiliaFilter>('todos')
  const [subPage, setSubPage] = useState(0)
  const [isFamiliaModalOpen, setIsFamiliaModalOpen] = useState(false)
  const [isSubfamiliaModalOpen, setIsSubfamiliaModalOpen] = useState(false)
  const [editingFamilia, setEditingFamilia] = useState<Familia | null>(null)
  const [editingSubfamilia, setEditingSubfamilia] = useState<Subfamilia | null>(null)
  const [familiaFormError, setFamiliaFormError] = useState<string | null>(null)
  const [subfamiliaFormError, setSubfamiliaFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [editFamiliaLoadingId, setEditFamiliaLoadingId] = useState<number | null>(null)
  const [editSubfamiliaLoadingId, setEditSubfamiliaLoadingId] = useState<number | null>(null)

  const canView = can(user, 'PRODUCTO_VER')
  const canCreate = can(user, 'PRODUCTO_CREAR')
  const canEdit = can(user, 'PRODUCTO_EDITAR')
  const canToggle = can(user, 'PRODUCTO_DESACTIVAR')

  const familiaFilters = useMemo(
    () => ({
      activo: getActivoFamiliaFilter(estado),
      page,
      size: PAGE_SIZE,
      texto: texto.trim(),
    }),
    [estado, page, texto],
  )

  const subfamiliaFilters = useMemo(
    () => ({
      activo: getActivoSubfamiliaFilter(subEstado),
      page: subPage,
      size: SUBFAMILIA_PAGE_SIZE,
      texto: subTexto.trim(),
    }),
    [subEstado, subPage, subTexto],
  )

  const familiasQuery = useQuery({
    enabled: canView,
    queryKey: ['familias', familiaFilters],
    queryFn: () => familiaService.getFamilias(familiaFilters),
  })

  const subfamiliasQuery = useQuery({
    enabled: canView && Boolean(selectedFamilia),
    queryKey: ['subfamilias-por-familia', selectedFamilia?.id, subfamiliaFilters],
    queryFn: () =>
      subfamiliaService.getSubfamiliasPorFamiliaPage(
        selectedFamilia?.id ?? 0,
        subfamiliaFilters.page,
        subfamiliaFilters.size,
        {
          activo: subfamiliaFilters.activo,
          texto: subfamiliaFilters.texto,
        },
      ),
  })

  const saveFamiliaMutation = useMutation({
    mutationFn: async (values: FamiliaFormValues) => {
      const payload = toFamiliaPayload(values)

      if (editingFamilia) {
        return familiaService.updateFamilia(editingFamilia.id, payload)
      }

      return familiaService.createFamilia(payload)
    },
    onSuccess: async (familia) => {
      await queryClient.invalidateQueries({ queryKey: ['familias'] })
      setIsFamiliaModalOpen(false)
      setEditingFamilia(null)
      setFamiliaFormError(null)
      setSelectedFamilia((current) => (current?.id === familia.id ? familia : current))
      setFeedback({
        type: 'success',
        message: editingFamilia ? 'Familia actualizada correctamente.' : 'Familia creada correctamente.',
      })
    },
    onError: (error) => {
      setFamiliaFormError(getFamiliaApiErrorMessage(error))
    },
  })

  const saveSubfamiliaMutation = useMutation({
    mutationFn: async (values: SubfamiliaFormValues) => {
      const payload = toSubfamiliaPayload(values)

      if (editingSubfamilia) {
        return subfamiliaService.updateSubfamilia(editingSubfamilia.id, payload)
      }

      return subfamiliaService.createSubfamilia(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subfamilias'] })
      await queryClient.invalidateQueries({ queryKey: ['subfamilias-por-familia'] })
      setIsSubfamiliaModalOpen(false)
      setEditingSubfamilia(null)
      setSubfamiliaFormError(null)
      setFeedback({
        type: 'success',
        message: editingSubfamilia
          ? 'Subfamilia actualizada correctamente.'
          : 'Subfamilia creada correctamente.',
      })
    },
    onError: (error) => {
      setSubfamiliaFormError(getSubfamiliaApiErrorMessage(error))
    },
  })

  const toggleFamiliaMutation = useMutation({
    mutationFn: async (action: Extract<ConfirmAction, { scope: 'familia' }>) => {
      if (action.type === 'activar') {
        return familiaService.activarFamilia(action.familia.id)
      }

      return familiaService.desactivarFamilia(action.familia.id)
    },
    onSuccess: async (familia, action) => {
      await queryClient.invalidateQueries({ queryKey: ['familias'] })
      setSelectedFamilia((current) => (current?.id === familia.id ? familia : current))
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Familia activada correctamente.'
            : 'Familia desactivada correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getFamiliaApiErrorMessage(error) })
    },
  })

  const toggleSubfamiliaMutation = useMutation({
    mutationFn: async (action: Extract<ConfirmAction, { scope: 'subfamilia' }>) => {
      if (action.type === 'activar') {
        return subfamiliaService.activarSubfamilia(action.subfamilia.id)
      }

      return subfamiliaService.desactivarSubfamilia(action.subfamilia.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['subfamilias'] })
      await queryClient.invalidateQueries({ queryKey: ['subfamilias-por-familia'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Subfamilia activada correctamente.'
            : 'Subfamilia desactivada correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getSubfamiliaApiErrorMessage(error) })
    },
  })

  const familias = familiasQuery.data?.content ?? []
  const totalElements = familiasQuery.data?.totalElements ?? 0
  const totalPages = familiasQuery.data?.totalPages ?? 0
  const rawSubfamilias = subfamiliasQuery.data?.content ?? []
  const subfamilias = filterSubfamilias(rawSubfamilias, subTexto, subEstado)
  const subTotalElements = subfamilias.length
  const subTotalPages = subfamiliasQuery.data?.totalPages ?? 0

  const openCreateFamiliaModal = () => {
    setEditingFamilia(null)
    setFamiliaFormError(null)
    setIsFamiliaModalOpen(true)
  }

  const openEditFamiliaModal = async (familia: Familia) => {
    setFeedback(null)
    setFamiliaFormError(null)
    setEditFamiliaLoadingId(familia.id)

    try {
      const detalle = await familiaService.getFamilia(familia.id)
      setEditingFamilia(detalle)
      setIsFamiliaModalOpen(true)
    } catch (error) {
      setFeedback({ type: 'error', message: getFamiliaApiErrorMessage(error) })
    } finally {
      setEditFamiliaLoadingId(null)
    }
  }

  const selectFamilia = (familia: Familia) => {
    setSelectedFamilia(familia)
    setSubTexto('')
    setSubEstado('todos')
    setSubPage(0)
  }

  const openCreateSubfamiliaModal = () => {
    if (!selectedFamilia) {
      setFeedback({ type: 'error', message: 'Seleccione una familia para crear subfamilias.' })
      return
    }

    setEditingSubfamilia(null)
    setSubfamiliaFormError(null)
    setIsSubfamiliaModalOpen(true)
  }

  const openEditSubfamiliaModal = async (subfamilia: Subfamilia) => {
    setFeedback(null)
    setSubfamiliaFormError(null)
    setEditSubfamiliaLoadingId(subfamilia.id)

    try {
      const detalle = await subfamiliaService.getSubfamilia(subfamilia.id)
      setEditingSubfamilia(detalle)
      setIsSubfamiliaModalOpen(true)
    } catch (error) {
      setFeedback({ type: 'error', message: getSubfamiliaApiErrorMessage(error) })
    } finally {
      setEditSubfamiliaLoadingId(null)
    }
  }

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Familias y Subfamilias"
          description="Administra la clasificacion principal y secundaria de productos."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">No tiene permisos para consultar familias.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Familias y Subfamilias"
          description="Administra la clasificacion principal y secundaria de productos."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={familiasQuery.isFetching || subfamiliasQuery.isFetching}
            onClick={() => {
              familiasQuery.refetch()
              if (selectedFamilia) {
                subfamiliasQuery.refetch()
              }
            }}
            type="button"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
        </div>
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

      {familiasQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getFamiliaApiErrorMessage(familiasQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Familias</h2>
            <p className="mt-1 text-sm text-slate-500">
              Seleccione una familia para gestionar sus subfamilias.
            </p>
          </div>
          {canCreate ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={openCreateFamiliaModal}
              type="button"
            >
              <Plus size={17} />
              Nueva familia
            </button>
          ) : null}
        </div>

        <FamiliaFilters
          estado={estado}
          onEstadoChange={(value) => {
            setEstado(value)
            setPage(0)
          }}
          onTextoChange={(value) => {
            setTexto(value)
            setPage(0)
          }}
          texto={texto}
        />
      </Card>

      <FamiliaTable
        canEdit={canEdit}
        canToggle={canToggle}
        familias={familias}
        isLoading={familiasQuery.isLoading}
        onActivar={(familia) => setConfirmAction({ familia, scope: 'familia', type: 'activar' })}
        onDesactivar={(familia) =>
          setConfirmAction({ familia, scope: 'familia', type: 'desactivar' })
        }
        onEdit={openEditFamiliaModal}
        onSelect={selectFamilia}
        selectedFamiliaId={selectedFamilia?.id}
        toggleLoadingId={
          toggleFamiliaMutation.isPending && confirmAction?.scope === 'familia'
            ? confirmAction.familia.id
            : editFamiliaLoadingId
        }
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} familia{totalElements === 1 ? '' : 's'} encontrada
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || familiasQuery.isFetching}
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
            disabled={page + 1 >= totalPages || familiasQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              {selectedFamilia ? `Subfamilias de: ${selectedFamilia.nombre}` : 'Subfamilias'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedFamilia
                ? 'Gestione la clasificacion secundaria de la familia seleccionada.'
                : 'Selecciona una familia para ver sus subfamilias.'}
            </p>
          </div>
          {canCreate ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedFamilia}
              onClick={openCreateSubfamiliaModal}
              type="button"
            >
              <Plus size={17} />
              Nueva subfamilia
            </button>
          ) : null}
        </div>

        {selectedFamilia ? (
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="text-sm font-medium text-slate-700">
              Buscar
              <div className="mt-1 flex h-10 items-center rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100">
                <Search size={17} className="text-slate-400" />
                <input
                  className="h-full flex-1 border-0 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  onChange={(event) => {
                    setSubTexto(event.target.value)
                    setSubPage(0)
                  }}
                  placeholder="Nombre o descripcion"
                  type="search"
                  value={subTexto}
                />
              </div>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Estado
              <select
                className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                onChange={(event) => {
                  setSubEstado(event.target.value as EstadoSubfamiliaFilter)
                  setSubPage(0)
                }}
                value={subEstado}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Selecciona una familia para ver sus subfamilias.
          </div>
        )}
      </Card>

      {selectedFamilia ? (
        <>
          {subfamiliasQuery.isError ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getSubfamiliaApiErrorMessage(subfamiliasQuery.error)}
            </div>
          ) : null}

          <div className="mt-5">
            <SubfamiliaTable
              canEdit={canEdit}
              canToggle={canToggle}
              isLoading={subfamiliasQuery.isLoading}
              onActivar={(subfamilia) =>
                setConfirmAction({ scope: 'subfamilia', subfamilia, type: 'activar' })
              }
              onDesactivar={(subfamilia) =>
                setConfirmAction({ scope: 'subfamilia', subfamilia, type: 'desactivar' })
              }
              onEdit={openEditSubfamiliaModal}
              subfamilias={subfamilias}
              toggleLoadingId={
                toggleSubfamiliaMutation.isPending && confirmAction?.scope === 'subfamilia'
                  ? confirmAction.subfamilia.id
                  : editSubfamiliaLoadingId
              }
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {subTotalElements} subfamilia{subTotalElements === 1 ? '' : 's'} encontrada
              {subTotalElements === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={subPage === 0 || subfamiliasQuery.isFetching}
                onClick={() => setSubPage((currentPage) => Math.max(currentPage - 1, 0))}
                type="button"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="min-w-28 text-center">
                Pagina {subTotalPages === 0 ? 0 : subPage + 1} de {subTotalPages}
              </span>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={subPage + 1 >= subTotalPages || subfamiliasQuery.isFetching}
                onClick={() => setSubPage((currentPage) => currentPage + 1)}
                type="button"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : null}

      <FamiliaFormModal
        errorMessage={familiaFormError}
        familia={editingFamilia}
        isOpen={isFamiliaModalOpen}
        isSaving={saveFamiliaMutation.isPending}
        mode={editingFamilia ? 'edit' : 'create'}
        onClose={() => {
          if (!saveFamiliaMutation.isPending) {
            setIsFamiliaModalOpen(false)
            setEditingFamilia(null)
            setFamiliaFormError(null)
          }
        }}
        onSubmit={async (values) => {
          await saveFamiliaMutation.mutateAsync(values)
        }}
      />

      <SubfamiliaFormModal
        errorMessage={subfamiliaFormError}
        familias={selectedFamilia ? [selectedFamilia] : []}
        isLoadingOptions={false}
        isOpen={isSubfamiliaModalOpen}
        isSaving={saveSubfamiliaMutation.isPending}
        lockedFamilia={selectedFamilia}
        mode={editingSubfamilia ? 'edit' : 'create'}
        onClose={() => {
          if (!saveSubfamiliaMutation.isPending) {
            setIsSubfamiliaModalOpen(false)
            setEditingSubfamilia(null)
            setSubfamiliaFormError(null)
          }
        }}
        onSubmit={async (values) => {
          await saveSubfamiliaMutation.mutateAsync(values)
        }}
        subfamilia={editingSubfamilia}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar' : 'Desactivar'}{' '}
              {confirmAction.scope === 'familia' ? 'familia' : 'subfamilia'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirme que desea {confirmAction.type === 'activar' ? 'activar' : 'desactivar'}{' '}
              {confirmAction.scope === 'familia' ? 'la familia' : 'la subfamilia'}{' '}
              <span className="font-semibold text-slate-900">
                {confirmAction.scope === 'familia'
                  ? confirmAction.familia.nombre
                  : confirmAction.subfamilia.nombre}
              </span>
              .
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={toggleFamiliaMutation.isPending || toggleSubfamiliaMutation.isPending}
                onClick={() => setConfirmAction(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 ${
                  confirmAction.type === 'activar'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={toggleFamiliaMutation.isPending || toggleSubfamiliaMutation.isPending}
                onClick={() => {
                  if (confirmAction.scope === 'familia') {
                    toggleFamiliaMutation.mutate(confirmAction)
                    return
                  }

                  toggleSubfamiliaMutation.mutate(confirmAction)
                }}
                type="button"
              >
                {toggleFamiliaMutation.isPending || toggleSubfamiliaMutation.isPending
                  ? 'Procesando...'
                  : 'Confirmar'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
