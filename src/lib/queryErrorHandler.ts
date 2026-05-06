import { toast } from "sonner";

export interface QueryError {
  message: string;
  code?: string;
  details?: string;
}

export const defaultQueryOptions = {
  retry: 2,
  staleTime: 30000,
  gcTime: 300000,
};

export function handleQueryError(error: unknown, context: string): QueryError {
  const err = error as { message?: string; code?: string; details?: string };
  const queryError: QueryError = {
    message: err.message || `Failed to load ${context}`,
    code: err.code,
    details: err.details,
  };
  console.error(`[Query Error] ${context}:`, queryError);
  return queryError;
}

export function createQueryErrorHandler(context: string) {
  return (error: unknown) => {
    const { message } = handleQueryError(error, context);
    toast.error(`Error loading ${context}`, { description: message });
  };
}

export function createMutationErrorHandler(context: string) {
  return (error: unknown) => {
    const { message } = handleQueryError(error, context);
    toast.error(`Error: ${context}`, { description: message });
  };
}
