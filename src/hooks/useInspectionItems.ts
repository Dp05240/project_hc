/** Inspection item queries — implemented in a later batch. */
export function useInspectionItems() {
  return {
    data: [] as unknown[],
    isLoading: false,
    error: null as Error | null,
  }
}
