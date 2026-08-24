import { Card } from '../../shared/components/Card'
import { PageHeader } from '../../shared/components/PageHeader'

export function AccessDeniedPage() {
  return (
    <div>
      <PageHeader
        title="Acceso no autorizado"
        description="El usuario autenticado no tiene permisos para este recurso."
      />
      <Card className="p-6">
        <p className="text-sm text-slate-600">
          Solicite el permiso correspondiente o ingrese con un usuario autorizado.
        </p>
      </Card>
    </div>
  )
}
