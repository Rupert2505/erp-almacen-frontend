import { describe, expect, it, vi } from 'vitest'
import type { PageResponse } from '../types/reporteInventario.types'
import { fetchAllReportRows } from './reportPagination'

function page(content: number[], number: number, totalPages: number): PageResponse<number> {
  return {
    content,
    number,
    size: 2,
    totalElements: 5,
    totalPages,
  }
}

describe('fetchAllReportRows', () => {
  it('concatena todas las paginas en su orden original', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page([1, 2], 0, 3))
      .mockResolvedValueOnce(page([3, 4], 1, 3))
      .mockResolvedValueOnce(page([5], 2, 3))

    await expect(fetchAllReportRows(fetchPage, 2)).resolves.toEqual([1, 2, 3, 4, 5])
    expect(fetchPage.mock.calls).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
    ])
  })

  it('se detiene de forma segura si el servidor devuelve una pagina vacia', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page([], 0, 4))

    await expect(fetchAllReportRows(fetchPage)).resolves.toEqual([])
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })
})
