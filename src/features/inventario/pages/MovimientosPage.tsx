import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'

export function MovimientosPage() {
  return (
    <div>
      <PageHeader
        title="Movimientos"
        description="Modulo preparado para entradas, salidas y ajustes de inventario."
      />
      <Card className="p-6">
        <p className="text-sm text-slate-600">Placeholder del modulo Movimientos.</p>
      </Card>
    </div>
  )
}
