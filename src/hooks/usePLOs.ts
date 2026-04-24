/** PLO queries — implemented in a later batch. */
export function usePLOs() {
  return {
    data: [] as unknown[],
    isLoading: false,
    error: null as Error | null,
  }
}
