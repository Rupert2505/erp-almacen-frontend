import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  ScrollText,
  ShieldCheck,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const navGroups = [
  {
    label: 'Principal',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalogos',
    items: [{ label: 'Productos', to: '/productos', icon: Package }],
  },
  {
    label: 'Inventario',
    items: [
      { label: 'Movimientos', to: '/inventario/movimientos', icon: ClipboardList },
      { label: 'Stock', to: '/inventario/stock', icon: Warehouse },
      { label: 'Kardex', to: '/inventario/kardex', icon: ScrollText },
    ],
  },
  {
    label: 'Reportes',
    items: [{ label: 'Inventario', to: '/reportes/inventario', icon: BarChart3 }],
  },
  {
    label: 'Administracion',
    items: [{ label: 'Usuarios', to: '/usuarios', icon: Users }],
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/45 transition lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col bg-slate-950 text-white transition lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-cyan-400 text-slate-950">
              <Boxes size={22} />
            </span>
            <div>
              <p className="text-base font-semibold">ERP Almacen</p>
              <p className="text-xs text-slate-400">Gestion de inventario</p>
            </div>
          </div>
          <button
            aria-label="Cerrar menu"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon

                    return (
                      <NavLink
                        className={({ isActive }) =>
                          [
                            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
                            isActive
                              ? 'bg-cyan-400 text-slate-950'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white',
                          ].join(' ')
                        }
                        key={item.to}
                        onClick={onClose}
                        to={item.to}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-3 rounded-md bg-white/5 px-3 py-3">
            <ShieldCheck size={20} className="text-cyan-300" />
            <div>
              <p className="text-sm font-medium">Sesion JWT</p>
              <p className="text-xs text-slate-400">Autorizacion activa</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
