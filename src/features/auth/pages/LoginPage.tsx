import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { Boxes, Lock, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router-dom'
import logoBallenaIcon from '../../../assets/images/logo_ballena_02.png'
import { useAuth } from '../context/useAuth'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { isAuthenticated, login, status } = useAuth()
  const location = useLocation()
  const [loginError, setLoginError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  if (isAuthenticated) {
    const state = location.state as LocationState | null
    return <Navigate to={state?.from?.pathname ?? '/dashboard'} replace />
  }

  const onSubmit = async (values: LoginFormValues) => {
    setLoginError(null)

    try {
      await login(values)
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        setLoginError('Usuario o contrasena incorrectos.')
        return
      }

      setLoginError(
        'No se pudo conectar con el backend. Verifique que este activo y que CORS permita el acceso.',
      )
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_420px]">
        <div className="hidden bg-slate-900 px-10 py-10 text-white md:block">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-cyan-500 text-slate-950">
              <Boxes size={24} />
            </span>
            <div>
              <p className="text-sm font-medium text-cyan-200">ERP Almacen</p>
              <h1 className="text-2xl font-semibold">Control operativo</h1>
            </div>
          </div>
          <div className="flex h-56 items-center justify-center">
            <div className="rounded-full bg-gradient-to-br from-cyan-300/24 via-cyan-500/8 to-slate-950/0 p-px shadow-[0_22px_76px_rgba(8,145,178,0.16)]">
              <div className="grid h-52 w-52 place-items-center rounded-full bg-[radial-gradient(circle_at_center,rgba(240,249,255,0.2),rgba(186,230,253,0.14)_46%,rgba(56,189,248,0.055)_72%)]">
                <img
                  alt="Ballena Carrocerias"
                  className="h-44 w-44 object-contain drop-shadow-2xl"
                  src={logoBallenaIcon}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10">
          <div className="mb-8 md:hidden">
            <div className="mb-3 flex items-center gap-3 text-slate-900">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white">
                <img
                  alt="Ballena Carrocerias"
                  className="h-10 w-10 object-contain"
                  src={logoBallenaIcon}
                />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-500">ERP Almacen</p>
                <h1 className="text-xl font-semibold">Iniciar sesion</h1>
              </div>
            </div>
          </div>

          <div className="mb-8 hidden md:block">
            <p className="text-sm font-medium text-slate-500">Bienvenido</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Iniciar sesion</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Usuario</span>
              <span className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100">
                <User size={18} className="text-slate-400" />
                <input
                  autoComplete="username"
                  className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  data-preserve-case="true"
                  placeholder="admin"
                  {...register('username')}
                />
              </span>
              {errors.username ? (
                <span className="mt-1 block text-sm text-red-600">{errors.username.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Contrasena</span>
              <span className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100">
                <Lock size={18} className="text-slate-400" />
                <input
                  autoComplete="current-password"
                  className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  placeholder="Ingrese su contrasena"
                  type="password"
                  {...register('password')}
                />
              </span>
              {errors.password ? (
                <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>
              ) : null}
            </label>

            {loginError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loginError}
              </div>
            ) : null}

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting || status === 'checking'}
              type="submit"
            >
              {isSubmitting ? 'Validando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
