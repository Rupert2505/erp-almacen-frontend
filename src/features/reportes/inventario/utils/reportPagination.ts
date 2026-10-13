import type { PageResponse } from '../types/reporteInventario.types'

export const EXPORT_PAGE_SIZE = 500

export async function fetchAllReportRows<T>(
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>,
  pageSize = EXPORT_PAGE_SIZE,
) {
  const rows: T[] = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const response = await fetchPage(page, pageSize)
    rows.push(...response.content)
    totalPages = response.totalPages

    if (response.content.length === 0) {
      break
    }

    page += 1
  }

  return rows
}
