import { afterEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../../features/auth/services/authService'
import { kardexService } from '../../features/inventario/kardex/services/kardexService'
import { movimientoService } from '../../features/inventario/movimientos/services/movimientoService'
import { stockService } from '../../features/inventario/stock/services/stockService'
import { productoService } from '../../features/productos/services/productoService'
import { proveedorService } from '../../features/proveedores/services/proveedorService'
import { apiClient } from './apiClient'
import { unwrapApiData } from './apiResponse'

describe('servicios Axios y respuestas API', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('unwrapApiData devuelve data cuando la respuesta viene envuelta', () => {
    expect(unwrapApiData({ success: true, data: { ok: true } })).toEqual({ ok: true })
    expect(unwrapApiData({ ok: true })).toEqual({ ok: true })
  })

  it('authService.login y me usan endpoints correctos y normalizan usuario', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        data: {
          accessToken: 'abc',
          tokenType: 'Bearer',
          expiresIn: 3600,
          username: 'admin',
          nombres: 'Admin',
          apellidos: 'ERP',
          email: 'admin@example.com',
          roles: ['ADMIN'],
          permisos: ['PRODUCTO_VER'],
        },
      },
    })
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          username: 'admin',
          nombres: 'Admin',
          apellidos: 'ERP',
          email: 'admin@example.com',
        },
      },
    })

    await expect(authService.login({ username: 'admin', password: 'secret123' })).resolves.toMatchObject({
      accessToken: 'abc',
    })
    await expect(authService.me()).resolves.toEqual({
      username: 'admin',
      nombres: 'Admin',
      apellidos: 'ERP',
      email: 'admin@example.com',
      roles: [],
      permisos: [],
    })

    expect(post).toHaveBeenCalledWith('/api/auth/login', {
      username: 'admin',
      password: 'secret123',
    })
    expect(get).toHaveBeenCalledWith('/api/auth/me')
  })

  it('productoService y proveedorService envian parametros de busqueda', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
        },
      },
    })

    await productoService.getProductos({
      activo: true,
      page: 0,
      size: 10,
      texto: 'codo',
      tipoArticuloId: 3,
    })
    await proveedorService.getProveedores({
      activo: false,
      page: 1,
      size: 20,
      texto: 'ruc',
    })

    expect(get).toHaveBeenNthCalledWith(1, '/api/productos', {
      params: {
        activo: true,
        page: 0,
        size: 10,
        texto: 'codo',
        tipoArticuloId: 3,
      },
    })
    expect(get).toHaveBeenNthCalledWith(2, '/api/proveedores', {
      params: {
        activo: false,
        page: 1,
        size: 20,
        texto: 'ruc',
      },
    })
  })

  it('movimientoService crea borrador/confirmado y consulta ordenado por fecha desc', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: [] },
    })
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, data: { id: 1, numero: 'MOV-1' } },
    })
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      data: { success: true, data: { id: 1, numero: 'MOV-1', estado: 'CANCELADO' } },
    })

    await movimientoService.getMovimientos({
      page: 0,
      size: 10,
      texto: 'MOV',
      tipoMovimiento: 'SALIDA_VENTA',
      estado: 'BORRADOR',
    })
    await movimientoService.createMovimiento({
      tipoMovimiento: 'SALIDA_VENTA',
      almacenOrigenId: 1,
      confirmar: true,
      detalles: [{ productoId: 1, cantidad: 1, costoUnitario: 10 }],
    })
    await movimientoService.cancelarMovimiento(1, 'Error de digitacion')

    expect(get).toHaveBeenCalledWith('/api/inventario/movimientos', {
      params: {
        page: 0,
        size: 10,
        texto: 'MOV',
        tipoMovimiento: 'SALIDA_VENTA',
        estado: 'BORRADOR',
        sort: 'fechaMovimiento,desc',
      },
    })
    expect(post).toHaveBeenCalledWith('/api/inventario/movimientos', {
      tipoMovimiento: 'SALIDA_VENTA',
      almacenOrigenId: 1,
      confirmar: true,
      detalles: [{ productoId: 1, cantidad: 1, costoUnitario: 10 }],
    })
    expect(patch).toHaveBeenCalledWith('/api/inventario/movimientos/1/cancelar', {
      motivoCancelacion: 'Error de digitacion',
    })
  })

  it('stockService usa filtros de producto/almacen/ubicacion para costo promedio', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: [] },
    })

    await stockService.getStock({
      page: 0,
      size: 10,
      productoId: 5,
      almacenId: 2,
      ubicacionId: 7,
      soloConStock: true,
      texto: 'codo',
    })

    expect(get).toHaveBeenCalledWith('/api/inventario/stock', {
      params: {
        page: 0,
        size: 10,
        texto: 'codo',
        productoId: 5,
        almacenId: 2,
        ubicacionId: 7,
        soloConStock: true,
      },
    })
  })

  it('kardexService transforma fechas a rango diario', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: [] },
    })

    await kardexService.getKardex({
      page: 0,
      size: 10,
      productoId: 5,
      almacenId: 2,
      ubicacionId: 7,
      tipoMovimiento: 'ENTRADA_COMPRA',
      texto: 'producto',
      fechaDesde: '2026-06-01',
      fechaHasta: '2026-06-12',
    })

    expect(get).toHaveBeenCalledWith('/api/inventario/kardex', {
      params: {
        page: 0,
        size: 10,
        texto: 'producto',
        productoId: 5,
        almacenId: 2,
        ubicacionId: 7,
        tipoMovimiento: 'ENTRADA_COMPRA',
        fechaDesde: '2026-06-01T00:00:00',
        fechaHasta: '2026-06-12T23:59:59',
      },
    })
  })
})
