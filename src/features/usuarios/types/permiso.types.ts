export type Permiso = {
  id: number
  codigo: string
  descripcion?: string | null
  activo: boolean
  creadoEn?: string | null
  actualizadoEn?: string | null
}
