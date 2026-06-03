import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'

export function KardexPage() {
  return (
    <div>
      <PageHeader title="Kardex" description="Modulo preparado para trazabilidad de movimientos." />
      <Card className="p-6">
        <p className="text-sm text-slate-600">Placeholder del modulo Kardex.</p>
      </Card>
    </div>
  )
}
