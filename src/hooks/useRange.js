import { useMemo } from "react";

export function useRange(n) {
  return useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);
}
