import {
  BarChart3,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Package,
  Shapes,
  SlidersHorizontal,
  Truck,
  Tags,
  ScrollText,
  ShieldCheck,
  UserRound,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/context/useAuth'
import { can } from '../shared/utils/permissions'

type SidebarProps = {
  isCollapsed: boolean
  isOpen: boolean
  onClose: () => void
  onToggleCollapsed: () => void
}

const navGroups = [
  {
    label: 'Principal',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalogos',
    items: [
      { label: 'Productos', to: '/productos', icon: Package },
      { label: 'Familias y Subfamilias', to: '/familias', icon: Shapes },
      { label: 'Tipos de articulo', to: '/tipos-articulo', icon: SlidersHorizontal },
      { label: 'Marcas', to: '/marcas', icon: Tags },
      { label: 'Proveedores', to: '/proveedores', icon: Truck },
      { label: 'Almacenes', to: '/almacenes', icon: Building2 },
      { label: 'Ubicaciones', to: '/ubicaciones', icon: MapPinned },
    ],
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

export function Sidebar({ isCollapsed, isOpen, onClose, onToggleCollapsed }: SidebarProps) {
  const { user } = useAuth()
  const visibleNavGroups = navGroups
    .map((group) => {
      if (group.label !== 'Administracion') {
        return group
      }

      return {
        ...group,
        items: [
          ...group.items,
          ...(can(user, 'USUARIO_ADMIN')
            ? [{ label: 'Personal', to: '/personal', icon: UserRound }]
            : []),
        ],
      }
    })
    .filter((group) => group.items.length > 0)

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/45 transition lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col bg-slate-950 text-white transition-all duration-200 lg:translate-x-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div
          className={`flex h-16 items-center justify-between border-b border-white/10 px-5 ${
            isCollapsed ? 'lg:px-4' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-cyan-400 text-slate-950">
              <Boxes size={22} />
            </span>
            <div className={isCollapsed ? 'lg:hidden' : ''}>
              <p className="text-base font-semibold">ERP Almacen</p>
              <p className="text-xs text-slate-400">Gestion de inventario</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label={isCollapsed ? 'Expandir menu' : 'Contraer menu'}
              className="hidden h-9 w-9 place-items-center rounded-md text-slate-300 hover:bg-white/10 lg:grid"
              onClick={onToggleCollapsed}
              title={isCollapsed ? 'Expandir menu' : 'Contraer menu'}
              type="button"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              aria-label="Cerrar menu"
              className="grid h-9 w-9 place-items-center rounded-md text-slate-300 hover:bg-white/10 lg:hidden"
              onClick={onClose}
              type="button"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <nav className={`flex-1 overflow-y-auto py-5 ${isCollapsed ? 'lg:px-3 px-4' : 'px-4'}`}>
          <div className="space-y-6">
            {visibleNavGroups.map((group) => (
              <div key={group.label}>
                <p className={`mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ${isCollapsed ? 'lg:sr-only' : ''}`}>
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon

                    return (
                      <NavLink
                        className={({ isActive }) =>
                          [
                            'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition',
                            isCollapsed ? 'lg:justify-center lg:gap-0 gap-3' : 'gap-3',
                            isActive
                              ? 'bg-cyan-400 text-slate-950'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white',
                          ].join(' ')
                        }
                        key={item.to}
                        onClick={onClose}
                        title={item.label}
                        to={item.to}
                      >
                        <Icon size={18} />
                        <span className={isCollapsed ? 'lg:sr-only' : ''}>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className={`border-t border-white/10 py-4 ${isCollapsed ? 'lg:px-3 px-5' : 'px-5'}`}>
          <div className={`flex items-center rounded-md bg-white/5 px-3 py-3 ${isCollapsed ? 'lg:justify-center lg:gap-0 gap-3' : 'gap-3'}`}>
            <ShieldCheck size={20} className="text-cyan-300" />
            <div className={isCollapsed ? 'lg:sr-only' : ''}>
              <p className="text-sm font-medium">Sesion JWT</p>
              <p className="text-xs text-slate-400">Autorizacion activa</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
