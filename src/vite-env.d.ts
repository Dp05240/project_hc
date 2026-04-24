/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Optional absolute site URL for QR codes (e.g. https://projecth.example.com). Defaults to window.location.origin. */
  readonly VITE_PUBLIC_APP_URL?: string
  /** Supabase Storage bucket for inspection photos (default: inspection-photos). */
  readonly VITE_STORAGE_BUCKET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
