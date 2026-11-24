export const CV_LIST_PAGE_SIZE = 12;

export interface SearchableCvItem {
  title: string;
  personalInfo?: {
    targetJobTitle?: string | null;
  } | null;
}

/**
 * Filters CV summaries client-side by CV title or target job title (case-insensitive).
 */
export function filterCvSummaries<T extends SearchableCvItem>(
  cvs: T[],
  query: string
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return cvs;

  return cvs.filter((cv) => {
    const titleMatch = (cv.title || "").toLowerCase().includes(normalized);
    const jobTitleMatch = (cv.personalInfo?.targetJobTitle || "")
      .toLowerCase()
      .includes(normalized);
    return titleMatch || jobTitleMatch;
  });
}

/**
 * Returns the paginated slice and clamped page metadata for a list of items.
 */
export function paginateItems<T>(
  items: T[],
  requestedPage: number,
  pageSize: number = CV_LIST_PAGE_SIZE
): {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
} {
  const safePageSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(requestedPage) || 1), totalPages);
  const start = (currentPage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    currentPage,
    totalPages,
    totalItems,
  };
}
