/** Property queries — implemented in a later batch. */
export function useProperties() {
  return {
    data: [] as unknown[],
    isLoading: false,
    error: null as Error | null,
  }
}
