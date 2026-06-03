import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'

export function ProductosPage() {
  return (
    <div>
      <PageHeader title="Productos" description="Modulo preparado para el catalogo de productos." />
      <Card className="p-6">
        <p className="text-sm text-slate-600">Placeholder del modulo Productos.</p>
      </Card>
    </div>
  )
}
