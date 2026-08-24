import { afterEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../../features/auth/services/authService'
import { almacenService } from '../../features/almacenes/services/almacenService'
import { ubicacionService } from '../../features/almacenes/services/ubicacionService'
import { familiaService } from '../../features/familias/services/familiaService'
import { kardexService } from '../../features/inventario/kardex/services/kardexService'
import {
  getMovimientoApiErrorMessage,
  isMovimientoConflictError,
  movimientoService,
} from '../../features/inventario/movimientos/services/movimientoService'
import { stockService } from '../../features/inventario/stock/services/stockService'
import { marcaService } from '../../features/marcas/services/marcaService'
import { personalService } from '../../features/personal/services/personalService'
import { productoService } from '../../features/productos/services/productoService'
import { proveedorService } from '../../features/proveedores/services/proveedorService'
import { reporteInventarioService } from '../../features/reportes/inventario/services/reporteInventarioService'
import { subfamiliaService } from '../../features/subfamilias/services/subfamiliaService'
import { tipoArticuloService } from '../../features/tipos-articulo/services/tipoArticuloService'
import { usuarioService } from '../../features/usuarios/services/usuarioService'
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

  it('productoService conserva costoReferencial al guardar el costo base comercial', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, data: { id: 1, codigo: 'P-001' } },
    })
    const payload = {
      nombre: 'Producto comercial',
      tipoArticuloId: 1,
      familiaId: 2,
      unidadMedidaId: 3,
      costoReferencial: 12.71,
      controlaLote: false,
      controlaSerie: false,
    }

    await productoService.createProducto(payload)

    expect(post).toHaveBeenCalledWith('/api/productos', payload)
  })

  it('servicios de catalogos envian texto, estado y paginacion', async () => {
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

    await familiaService.getFamilias({
      activo: true,
      page: 0,
      size: 10,
      texto: 'rep',
    })
    await subfamiliaService.getSubfamilias({
      activo: false,
      familiaId: 2,
      page: 1,
      size: 15,
      texto: 'codos',
    })
    await marcaService.getMarcas({
      activo: true,
      page: 0,
      size: 20,
      texto: 'truper',
    })
    await tipoArticuloService.getTiposArticulo({
      activo: false,
      page: 2,
      size: 25,
      texto: 'epp',
    })

    expect(get).toHaveBeenNthCalledWith(1, '/api/familias', {
      params: {
        activo: true,
        page: 0,
        size: 10,
        texto: 'rep',
      },
    })
    expect(get).toHaveBeenNthCalledWith(2, '/api/subfamilias', {
      params: {
        activo: false,
        familiaId: 2,
        page: 1,
        size: 15,
        texto: 'codos',
      },
    })
    expect(get).toHaveBeenNthCalledWith(3, '/api/marcas', {
      params: {
        activo: true,
        page: 0,
        size: 20,
        texto: 'truper',
      },
    })
    expect(get).toHaveBeenNthCalledWith(4, '/api/tipos-articulo', {
      params: {
        activo: false,
        page: 2,
        size: 25,
        texto: 'epp',
      },
    })
  })

  it('servicios de almacenes, ubicaciones y usuarios envian filtros especializados', async () => {
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

    await almacenService.getAlmacenes({
      activo: true,
      page: 0,
      size: 10,
      texto: 'central',
    })
    await ubicacionService.getUbicaciones({
      activo: false,
      almacenId: 9,
      page: 1,
      size: 10,
      texto: 'anaquel',
    })
    await usuarioService.getUsuarios({
      activo: true,
      page: 0,
      rolId: 3,
      size: 10,
      texto: 'admin',
    })

    expect(get).toHaveBeenNthCalledWith(1, '/api/almacenes', {
      params: {
        activo: true,
        page: 0,
        size: 10,
        texto: 'central',
      },
    })
    expect(get).toHaveBeenNthCalledWith(2, '/api/almacenes/9/ubicaciones', {
      params: {
        activo: false,
        page: 1,
        size: 10,
        texto: 'anaquel',
      },
    })
    expect(get).toHaveBeenNthCalledWith(3, '/api/usuarios', {
      params: {
        activo: true,
        page: 0,
        rolId: 3,
        size: 10,
        texto: 'admin',
      },
    })
  })

  it('productoService consulta siguiente codigo por familia', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: 'REP-92',
      },
    })

    await expect(productoService.getSiguienteCodigo(7)).resolves.toBe('REP-92')

    expect(get).toHaveBeenCalledWith('/api/productos/siguiente-codigo', {
      params: { familiaId: 7 },
    })
  })

  it('personalService usa endpoints y parametros del mantenedor de personal', async () => {
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
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, data: { id: 1 } },
    })
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({
      data: { success: true, data: { id: 1 } },
    })
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      data: { success: true, data: { id: 1 } },
    })

    await personalService.getPersonal({
      activo: true,
      page: 0,
      size: 10,
      texto: 'juan',
    })
    await personalService.createPersonal({
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      nombres: 'JUAN',
    })
    await personalService.updatePersonal(1, {
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      nombres: 'JUAN',
    })
    await personalService.desactivarPersonal(1)

    expect(get).toHaveBeenCalledWith('/api/personal', {
      params: {
        activo: true,
        page: 0,
        size: 10,
        texto: 'juan',
      },
    })
    expect(post).toHaveBeenCalledWith('/api/personal', {
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      nombres: 'JUAN',
    })
    expect(put).toHaveBeenCalledWith('/api/personal/1', {
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      nombres: 'JUAN',
    })
    expect(patch).toHaveBeenCalledWith('/api/personal/1/desactivar')
  })

  it('movimientoService crea borrador/confirmado y consulta con orden por defecto del backend', async () => {
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
    await movimientoService.createDevolucionProveedor({
      movimientoOrigenId: 10,
      proveedorId: 2,
      fechaMovimiento: '2026-06-12T10:00:00',
      fechaDocumento: '2026-06-12',
      numeroNotaCredito: 'NC-001',
      motivo: 'Producto rechazado',
      observacion: null,
      confirmar: false,
      detalles: [
        {
          movimientoDetalleOrigenId: 99,
          productoId: 5,
          cantidad: 2,
          observacion: null,
        },
      ],
    })
    await movimientoService.getDevolucionesProveedor(10)
    await movimientoService.getCantidadesDevolucion(10)

    expect(get).toHaveBeenCalledWith('/api/inventario/movimientos', {
      params: {
        page: 0,
        size: 10,
        texto: 'MOV',
        tipoMovimiento: 'SALIDA_VENTA',
        estado: 'BORRADOR',
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
    expect(post).toHaveBeenNthCalledWith(2, '/api/inventario/movimientos/devoluciones-proveedor', {
      movimientoOrigenId: 10,
      proveedorId: 2,
      fechaMovimiento: '2026-06-12T10:00:00',
      fechaDocumento: '2026-06-12',
      numeroNotaCredito: 'NC-001',
      motivo: 'Producto rechazado',
      observacion: null,
      confirmar: false,
      detalles: [
        {
          movimientoDetalleOrigenId: 99,
          productoId: 5,
          cantidad: 2,
          observacion: null,
        },
      ],
    })
    expect(get).toHaveBeenNthCalledWith(2, '/api/inventario/movimientos/10/devoluciones')
    expect(get).toHaveBeenNthCalledWith(
      3,
      '/api/inventario/movimientos/10/cantidades-devolucion',
    )
  })

  it('movimientoService reconoce HTTP 409 como conflicto de concurrencia o datos', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {},
      },
    }

    expect(isMovimientoConflictError(error)).toBe(true)
    expect(getMovimientoApiErrorMessage(error)).toBe(
      'El registro fue modificado por otro usuario. Actualice la informacion e intente nuevamente.',
    )
  })

  it('movimientoService prioriza mensaje backend en HTTP 409', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          message: 'Conflicto de datos en stock.',
        },
      },
    }

    expect(getMovimientoApiErrorMessage(error)).toBe('Conflicto de datos en stock.')
  })

  it('movimientoService extrae mensajes funcionales de mensaje y detail', () => {
    expect(
      getMovimientoApiErrorMessage({
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            mensaje:
              'No se puede anular la entrada porque existen movimientos posteriores que utilizaron el stock o el costo promedio generado. Registre una devolucion al proveedor o un ajuste de inventario.',
          },
        },
      }),
    ).toMatch(/No se puede anular la entrada/)

    expect(
      getMovimientoApiErrorMessage({
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            detail: 'El movimiento ya fue anulado por otro usuario.',
          },
        },
      }),
    ).toBe('El movimiento ya fue anulado por otro usuario.')
  })

  it('movimientoService no expone mensajes tecnicos y recorta motivo de anulacion', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, data: { id: 1, numero: 'MOV-1', estado: 'ANULADO' } },
    })

    expect(
      getMovimientoApiErrorMessage({
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            error: 'DataIntegrityViolationException: SQL constraint detalle_movimiento_fk',
          },
        },
      }),
    ).toBe('El registro fue modificado por otro usuario. Actualice la informacion e intente nuevamente.')

    await movimientoService.anularMovimiento(1, '  ERROR DE INGRESO  ')

    expect(post).toHaveBeenCalledWith('/api/inventario/movimientos/1/anular', {
      motivo: 'ERROR DE INGRESO',
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
        sort: 'fechaUltimoMovimiento,desc',
        texto: 'codo',
        productoId: 5,
        almacenId: 2,
        ubicacionId: 7,
        soloConStock: true,
      },
    })
  })

  it('stockService usa endpoint especifico de bajo minimo con filtros', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: [] },
    })

    await stockService.getStockBajoMinimo({
      page: 2,
      size: 10,
      texto: 'valvula',
      productoId: 6,
      almacenId: 4,
      ubicacionId: 8,
    })

    expect(get).toHaveBeenCalledWith('/api/inventario/stock/bajo-minimo', {
      params: {
        page: 2,
        size: 10,
        texto: 'valvula',
        productoId: 6,
        almacenId: 4,
        ubicacionId: 8,
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
        sort: 'fechaMovimiento,id,desc',
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

  it('reporteInventarioService envia filtros a reportes paginados', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: [] },
    })

    await reporteInventarioService.getMovimientos({
      page: 1,
      size: 25,
      fechaDesde: '2026-08-01',
      fechaHasta: '2026-08-03',
      productoId: 10,
      almacenId: 20,
      proveedorId: 30,
      tipoMovimiento: 'ENTRADA_COMPRA',
      estado: 'CONFIRMADO',
      soloConStock: true,
    })

    expect(get).toHaveBeenCalledWith('/api/reportes/inventario/movimientos', {
      params: {
        page: 1,
        size: 25,
        texto: undefined,
        fechaDesde: '2026-08-01T00:00:00',
        fechaHasta: '2026-08-03T23:59:59',
        productoId: 10,
        almacenId: 20,
        ubicacionId: undefined,
        proveedorId: 30,
        familiaId: undefined,
        subfamiliaId: undefined,
        tipoArticuloId: undefined,
        marcaId: undefined,
        usuarioId: undefined,
        tipoMovimiento: 'ENTRADA_COMPRA',
        estado: 'CONFIRMADO',
        tipoComprobante: undefined,
        soloConStock: true,
        bajoMinimo: undefined,
        agruparPor: undefined,
      },
    })
  })

  it('reporteInventarioService solicita reportes avanzados con fechas simples', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          registros: [],
          resumen: null,
        },
      },
    })

    await reporteInventarioService.getStockValorizado({
      page: 0,
      size: 10,
      texto: 'REP',
      fechaDesde: '2026-08-01',
      fechaHasta: '2026-08-03',
      productoId: 10,
      almacenId: 20,
      ubicacionId: 40,
      familiaId: 50,
      subfamiliaId: 60,
      tipoArticuloId: 70,
      marcaId: 80,
      soloConStock: true,
      soloBajoMinimo: true,
    })

    expect(get).toHaveBeenCalledWith('/api/reportes/inventario/stock-valorizado', {
      params: {
        page: 0,
        size: 10,
        texto: 'REP',
        fechaDesde: '2026-08-01',
        fechaHasta: '2026-08-03',
        productoId: 10,
        almacenId: 20,
        ubicacionId: 40,
        proveedorId: undefined,
        familiaId: 50,
        subfamiliaId: 60,
        tipoArticuloId: 70,
        marcaId: 80,
        usuarioId: undefined,
        tipoMovimiento: undefined,
        estado: undefined,
        tipoComprobante: undefined,
        soloConStock: true,
        bajoMinimo: true,
        agruparPor: undefined,
      },
    })
  })

  it('reporteInventarioService descarga excel y pdf como blob', async () => {
    const blob = new Blob(['reporte'])
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: blob,
      headers: {
        'content-disposition': 'attachment; filename="stock-valorizado.xlsx"',
      },
    })

    await expect(
      reporteInventarioService.exportStockValorizado({
        page: 0,
        size: 10,
      }),
    ).resolves.toEqual({
      blob,
      filename: 'attachment; filename="stock-valorizado.xlsx"',
    })

    expect(get).toHaveBeenCalledWith('/api/reportes/inventario/stock-valorizado/excel', {
      params: expect.objectContaining({
        page: 0,
        size: 10,
      }),
      responseType: 'blob',
    })

    await reporteInventarioService.getMovimientoPdf(15)

    expect(get).toHaveBeenLastCalledWith('/api/reportes/inventario/movimientos/15/pdf', {
      params: undefined,
      responseType: 'blob',
    })
  })

  it('reporteInventarioService consulta y exporta salidas por OS con los filtros exactos', async () => {
    const blob = new Blob(['salidas-os'])
    const get = vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            registros: {
              content: [],
              totalElements: 0,
              totalPages: 0,
              number: 0,
              size: 20,
            },
            resumenPorOs: [],
          },
        },
      })
      .mockResolvedValueOnce({
        data: blob,
        headers: {
          'content-disposition': 'attachment; filename="salidas-valorizadas-por-os.xlsx"',
        },
      })

    const filters = {
      page: 0,
      size: 20,
      fechaDesde: '2026-08-01',
      fechaHasta: '2026-08-18',
      ordenTrabajo: ' OS-001 ',
      productoId: 10,
      estado: 'ANULADO' as const,
    }

    await reporteInventarioService.getSalidasPorOs(filters)
    await expect(reporteInventarioService.exportSalidasPorOs(filters)).resolves.toEqual({
      blob,
      filename: 'attachment; filename="salidas-valorizadas-por-os.xlsx"',
    })

    expect(get).toHaveBeenNthCalledWith(1, '/api/reportes/inventario/salidas-por-os', {
      params: {
        page: 0,
        size: 20,
        fechaDesde: '2026-08-01',
        fechaHasta: '2026-08-18',
        ordenTrabajo: 'OS-001',
        productoId: 10,
        estado: 'ANULADO',
      },
    })
    expect(get).toHaveBeenNthCalledWith(2, '/api/reportes/inventario/salidas-por-os/excel', {
      params: {
        fechaDesde: '2026-08-01',
        fechaHasta: '2026-08-18',
        ordenTrabajo: 'OS-001',
        productoId: 10,
        estado: 'ANULADO',
      },
      responseType: 'blob',
    })
  })

  it('salidas por OS omite estado para conservar CONFIRMADO por defecto del backend', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          registros: [],
          resumenPorOs: [],
        },
      },
    })

    await reporteInventarioService.getSalidasPorOs({ page: 0, size: 20 })

    expect(get).toHaveBeenCalledWith('/api/reportes/inventario/salidas-por-os', {
      params: {
        page: 0,
        size: 20,
        fechaDesde: undefined,
        fechaHasta: undefined,
        ordenTrabajo: undefined,
        productoId: undefined,
        estado: undefined,
      },
    })
  })
})
