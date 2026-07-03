export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  metadata: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
  };
}

export function calculatePagination(params: PaginationParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
