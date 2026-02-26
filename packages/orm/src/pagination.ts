/**
 * @gao/orm — Pagination Types
 */

export interface PaginationMeta {
  /** Current page (1-based index) */
  page: number;
  /** Number of items per page */
  perPage: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** True if there is a next page */
  hasNext: boolean;
  /** True if there is a previous page */
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  /** The actual data for the current page */
  data: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}
