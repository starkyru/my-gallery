'use client';

import { useState, useCallback, useRef } from 'react';
import { useNotification } from './useNotification';

interface UseRequestOptions<TResult> {
  onSuccess?: (result: TResult) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseRequestReturn<TParams extends unknown[], TResult> {
  isLoading: boolean;
  isFailed: boolean;
  isSucceeded: boolean;
  result: TResult | null;
  error: Error | null;
  fetch: (...args: TParams) => Promise<TResult | null>;
  reset: () => void;
}

export function useRequest<TParams extends unknown[], TResult>(
  fn: (...args: TParams) => Promise<TResult>,
  options?: UseRequestOptions<TResult>,
): UseRequestReturn<TParams, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [isSucceeded, setIsSucceeded] = useState(false);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const notify = useNotification();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetch = useCallback(
    async (...args: TParams): Promise<TResult | null> => {
      setIsLoading(true);
      setIsFailed(false);
      setIsSucceeded(false);
      setError(null);

      try {
        const res = await fn(...args);
        setResult(res);
        setIsSucceeded(true);
        if (optionsRef.current?.successMessage) {
          notify.success(optionsRef.current.successMessage);
        }
        optionsRef.current?.onSuccess?.(res);
        return res;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setIsFailed(true);
        notify.error(optionsRef.current?.errorMessage ?? e.message);
        optionsRef.current?.onError?.(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fn, notify],
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsFailed(false);
    setIsSucceeded(false);
    setResult(null);
    setError(null);
  }, []);

  return { isLoading, isFailed, isSucceeded, result, error, fetch, reset };
}
