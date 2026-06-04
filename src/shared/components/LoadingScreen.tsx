import { Loader2 } from 'lucide-react'

type LoadingScreenProps = {
  message?: string
}

export function LoadingScreen({ message = 'Cargando modulo...' }: LoadingScreenProps) {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Loader2 className="animate-spin" size={22} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{message}</p>
          <p className="mt-1 text-xs text-slate-500">Preparando la pantalla solicitada.</p>
        </div>
      </div>
    </div>
  )
}
