import { toast } from 'sonner';

export function useNotification() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
    warning: (message: string) => toast.warning(message),
    promise: <T>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
      toast.promise(promise, msgs),
  };
}
