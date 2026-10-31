import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { tx } from "@/api/client";

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Ocurrió un error inesperado";

/** Loads a read transaction on mount (and when params change); `reload()` runs it again. */
export function useTx<T>(txId: number, params: Record<string, unknown> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = JSON.stringify(params);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await tx<T>(txId, JSON.parse(paramsKey)));
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, [txId, paramsKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

/** Runs a write transaction and toasts the outcome. Resolves `{ data }` on success, `undefined` on failure. */
export async function runTx<T = unknown>(
  txId: number,
  params: Record<string, unknown>,
  successMessage: string,
): Promise<{ data: T } | undefined> {
  try {
    const data = await tx<T>(txId, params);
    toast.success(successMessage);
    return { data };
  } catch (e) {
    toast.error(messageOf(e));
    return undefined;
  }
}
