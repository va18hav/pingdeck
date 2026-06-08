/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the PingDeck backend, set in web/.env (e.g. http://localhost:8080).
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
