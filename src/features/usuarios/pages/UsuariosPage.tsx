import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'

export function UsuariosPage() {
  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Modulo preparado para administracion de usuarios y accesos."
      />
      <Card className="p-6">
        <p className="text-sm text-slate-600">Placeholder del modulo Usuarios.</p>
      </Card>
    </div>
  )
}
