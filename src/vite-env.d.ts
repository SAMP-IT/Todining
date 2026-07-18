/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ToDining API (server/). e.g. https://api.todining.com.
   *  Unset → the app runs on the localStorage fallback. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
