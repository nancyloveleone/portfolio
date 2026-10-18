import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function excludeLocalAlbumsFromBundle(): Plugin {
  return {
    name: 'exclude-local-albums-from-bundle',
    closeBundle() {
      const albumsDist = path.resolve(__dirname, 'dist/images/albums')
      if (fs.existsSync(albumsDist)) {
        fs.rmSync(albumsDist, { recursive: true, force: true })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), excludeLocalAlbumsFromBundle()],
})

