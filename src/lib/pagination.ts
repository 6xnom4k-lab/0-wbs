export const ACCOUNT_PAGE_SIZE = 25;

export type PaginationResult<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
};

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    rangeStart: totalItems === 0 ? 0 : startIndex + 1,
    rangeEnd: endIndex,
  };
}
