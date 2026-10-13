import { X } from 'lucide-react'
import type { Personal } from '../types/personal.types'

type PersonalDetailModalProps = {
  isOpen: boolean
  onClose: () => void
  personal?: Personal | null
}

const detailFields: Array<{
  label: string
  value: (personal: Personal) => string | null | undefined
}> = [
  {
    label: 'Documento',
    value: (personal) => `${personal.tipoDocumento} ${personal.numeroDocumento}`,
  },
  {
    label: 'Nombres',
    value: (personal) => personal.nombres,
  },
  {
    label: 'Apellidos',
    value: (personal) => personal.apellidos,
  },
  {
    label: 'Cargo',
    value: (personal) => personal.cargo,
  },
  {
    label: 'Area',
    value: (personal) => personal.area,
  },
  {
    label: 'Telefono',
    value: (personal) => personal.telefono,
  },
  {
    label: 'Email',
    value: (personal) => personal.email,
  },
  {
    label: 'Estado',
    value: (personal) => (personal.activo ? 'Activo' : 'Inactivo'),
  },
]

export function PersonalDetailModal({ isOpen, onClose, personal }: PersonalDetailModalProps) {
  if (!isOpen || !personal) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <section
        aria-labelledby="personal-detail-title"
        aria-modal="true"
        className="w-full max-w-2xl rounded-lg bg-white shadow-xl"
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950" id="personal-detail-title">
              Detalle de personal
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Informacion administrativa registrada.
            </p>
          </div>
          <button
            aria-label="Cerrar detalle de personal"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <dl className="grid gap-x-6 gap-y-5 px-6 py-6 sm:grid-cols-2">
          {detailFields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {field.value(personal) || '-'}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
        </div>
      </section>
    </div>
  )
}
