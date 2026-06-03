import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'

export function StockPage() {
  return (
    <div>
      <PageHeader title="Stock" description="Modulo preparado para consultar existencias." />
      <Card className="p-6">
        <p className="text-sm text-slate-600">Placeholder del modulo Stock.</p>
      </Card>
    </div>
  )
}
