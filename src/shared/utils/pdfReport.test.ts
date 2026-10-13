import { describe, expect, it } from 'vitest'
import { paginatePdfTableRows, type PdfReportRowKind } from './pdfReport'

describe('paginatePdfTableRows', () => {
  it('usa menor capacidad en la primera pagina y recupera el espacio del resumen despues', () => {
    const rows = Array.from({ length: 8 }, (_, index) => ({ index }))
    const pages = paginatePdfTableRows(rows, [], {
      firstPageHeight: 80,
      nextPageHeight: 160,
      rowHeight: 40,
    })

    expect(pages.map((page) => page.length)).toEqual([2, 4, 2])
  })

  it('asigna poca altura al proveedor y conserva una separacion entre grupos', () => {
    const rows = ['proveedor 1', 'detalle 1', 'subtotal 1', '', 'proveedor 2', 'detalle 2']
    const kinds: PdfReportRowKind[] = [
      'group',
      'detail',
      'subtotal',
      'spacer',
      'group',
      'detail',
    ]
    const [page] = paginatePdfTableRows(rows, kinds, {
      firstPageHeight: 220,
      nextPageHeight: 220,
      rowHeight: 40,
    })

    expect(page.map(({ height, kind }) => [kind, height])).toEqual([
      ['group', 26],
      ['detail', 40],
      ['subtotal', 32],
      ['spacer', 10],
      ['group', 26],
      ['detail', 40],
    ])
  })

  it('repite el proveedor cuando su detalle continua en otra pagina', () => {
    const rows = ['proveedor', 'detalle 1', 'detalle 2', 'detalle 3']
    const kinds: PdfReportRowKind[] = ['group', 'detail', 'detail', 'detail']
    const pages = paginatePdfTableRows(rows, kinds, {
      firstPageHeight: 106,
      nextPageHeight: 106,
      rowHeight: 40,
    })

    expect(pages).toHaveLength(2)
    expect(pages[1][0]).toMatchObject({ kind: 'group', row: 'proveedor' })
    expect(pages[1][1]).toMatchObject({ kind: 'detail', row: 'detalle 3' })
  })

  it('mantiene compacto el subtotal cuando el detalle usa poca altura', () => {
    const [page] = paginatePdfTableRows(['detalle', 'subtotal'], ['detail', 'subtotal'], {
      firstPageHeight: 60,
      nextPageHeight: 60,
      rowHeight: 24,
    })

    expect(page.map(({ height, kind }) => [kind, height])).toEqual([
      ['detail', 24],
      ['subtotal', 24],
    ])
  })
})
