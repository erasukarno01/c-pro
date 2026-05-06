import { useCallback, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  isInitialLoad: boolean;
  lastUpdated: Date | null;
  retryCount: number;
}

export interface AsyncStateOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheDuration?: number;
  showLoadingOnRefetch?: boolean;
  errorMessages?: {
    network?: string;
    timeout?: string;
    server?: string;
    default?: string;
  };
}

export interface UseAsyncStateReturn<T> extends AsyncState<T> {
  execute: (asyncFn: () => Promise<T>) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  refetch: () => Promise<void>;
  setData: (data: T) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

function getDefaultErrorMessage(error: unknown, errorMessages?: AsyncStateOptions["errorMessages"]) {
  const e = error as { name?: string; message?: string; status?: number };
  if (!e) return errorMessages?.default || "Terjadi kesalahan yang tidak diketahui";
  if (e.name === "TypeError" || e.message?.toLowerCase().includes("fetch")) {
    return errorMessages?.network || "Koneksi bermasalah. Periksa internet Anda.";
  }
  if (e.name === "TimeoutError" || e.message?.toLowerCase().includes("timeout")) {
    return errorMessages?.timeout || "Request timeout. Coba lagi.";
  }
  if ((e.status || 0) >= 500) {
    return errorMessages?.server || "Server error. Coba lagi nanti.";
  }
  return e.message || errorMessages?.default || "Terjadi kesalahan yang tidak diketahui";
}

export function useAsyncState<T>(options: AsyncStateOptions = {}): UseAsyncStateReturn<T> {
  const {
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    cache = true,
    cacheDuration = 5 * 60 * 1000,
    showLoadingOnRefetch = true,
    errorMessages,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    isEmpty: true,
    isInitialLoad: true,
    lastUpdated: null,
    retryCount: 0,
  });

  const lastAsyncFnRef = useRef<(() => Promise<T>) | null>(null);
  const cacheDataRef = useRef<{ data: T; timestamp: number } | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const execute = useCallback(
    async (asyncFn: () => Promise<T>) => {
      lastAsyncFnRef.current = asyncFn;

      if (cache && cacheDataRef.current) {
        const age = Date.now() - cacheDataRef.current.timestamp;
        if (age < cacheDuration) {
          setState((prev) => ({
            ...prev,
            data: cacheDataRef.current!.data,
            loading: false,
            error: null,
            isEmpty: Array.isArray(cacheDataRef.current!.data) ? cacheDataRef.current!.data.length === 0 : !cacheDataRef.current!.data,
            isInitialLoad: false,
            lastUpdated: new Date(cacheDataRef.current!.timestamp),
          }));
          return;
        }
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const result = await asyncFn();
        if (cache) {
          cacheDataRef.current = { data: result, timestamp: Date.now() };
        }
        setState({
          data: result,
          loading: false,
          error: null,
          isEmpty: Array.isArray(result) ? result.length === 0 : !result,
          isInitialLoad: false,
          lastUpdated: new Date(),
          retryCount: 0,
        });
      } catch (error) {
        const message = getDefaultErrorMessage(error, errorMessages);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
          isEmpty: true,
          isInitialLoad: false,
          retryCount: prev.retryCount + 1,
        }));

        if (autoRetry) {
          setState((prev) => {
            if (prev.retryCount >= maxRetries) return prev;
            const nextRetryCount = prev.retryCount;
            if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
            retryTimerRef.current = window.setTimeout(() => {
              if (lastAsyncFnRef.current) void execute(lastAsyncFnRef.current);
            }, retryDelay * Math.pow(2, nextRetryCount));
            return prev;
          });
        }
      }
    },
    [autoRetry, cache, cacheDuration, errorMessages, maxRetries, retryDelay],
  );

  const retry = useCallback(async () => {
    if (lastAsyncFnRef.current) await execute(lastAsyncFnRef.current);
  }, [execute]);

  const reset = useCallback(() => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    cacheDataRef.current = null;
    lastAsyncFnRef.current = null;
    setState({
      data: null,
      loading: false,
      error: null,
      isEmpty: true,
      isInitialLoad: true,
      lastUpdated: null,
      retryCount: 0,
    });
  }, []);

  const refetch = useCallback(async () => {
    cacheDataRef.current = null;
    if (!lastAsyncFnRef.current) return;
    if (showLoadingOnRefetch) {
      await execute(lastAsyncFnRef.current);
      return;
    }

    setState((prev) => ({ ...prev, loading: false }));
    await execute(lastAsyncFnRef.current);
  }, [execute, showLoadingOnRefetch]);

  const setData = useCallback(
    (data: T) => {
      if (cache) cacheDataRef.current = { data, timestamp: Date.now() };
      setState({
        data,
        loading: false,
        error: null,
        isEmpty: Array.isArray(data) ? data.length === 0 : !data,
        isInitialLoad: false,
        lastUpdated: new Date(),
        retryCount: 0,
      });
    },
    [cache],
  );

  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      loading: false,
      error,
      isEmpty: true,
      isInitialLoad: false,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    refetch,
    setData,
    setError,
    clearError,
  };
}

export function usePaginatedAsyncState<T>(
  options: AsyncStateOptions & {
    pageSize?: number;
    initialPage?: number;
  } = {},
) {
  const { pageSize = 20, initialPage = 1, ...asyncOptions } = options;
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const lastFetchFnRef = useRef<((pageArg: number, pageSizeArg: number) => Promise<{
    items: T[];
    pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  }>) | null>(null);

  const asyncState = useAsyncState<{
    items: T[];
    pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
  }>(asyncOptions);

  const fetchPage = useCallback(
    async (fetchFn: (pageArg: number, pageSizeArg: number) => Promise<{
      items: T[];
      pagination: { page: number; totalPages: number; totalItems: number; pageSize: number };
    }>, targetPage = page) => {
      lastFetchFnRef.current = fetchFn;
      await asyncState.execute(async () => {
        const result = await fetchFn(targetPage, pageSize);
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.totalItems);
        return result;
      });
    },
    [asyncState, page, pageSize],
  );

  const nextPage = useCallback(async () => {
    if (page < totalPages && lastFetchFnRef.current) {
      await fetchPage(lastFetchFnRef.current, page + 1);
    }
  }, [fetchPage, page, totalPages]);

  const prevPage = useCallback(async () => {
    if (page > 1 && lastFetchFnRef.current) {
      await fetchPage(lastFetchFnRef.current, page - 1);
    }
  }, [fetchPage, page]);

  const goToPage = useCallback(async (targetPage: number) => {
    if (!lastFetchFnRef.current) return;
    if (targetPage < 1 || targetPage > totalPages) return;
    await fetchPage(lastFetchFnRef.current, targetPage);
  }, [fetchPage, totalPages]);

  return {
    ...asyncState,
    items: asyncState.data?.items ?? [],
    page,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    fetchPage,
    nextPage,
    prevPage,
    goToPage,
  };
}
