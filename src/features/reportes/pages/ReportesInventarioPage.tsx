import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'

export function ReportesInventarioPage() {
  return (
    <div>
      <PageHeader
        title="Reporte de inventario"
        description="Modulo preparado para reportes y analisis del almacen."
      />
      <Card className="p-6">
        <p className="text-sm text-slate-600">Placeholder del modulo Reportes de inventario.</p>
      </Card>
    </div>
  )
}
