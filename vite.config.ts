import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function excludeLocalImagesFromBundle(): Plugin {
  return {
    name: 'exclude-local-images-from-bundle',
    closeBundle() {
      const imagesDist = path.resolve(__dirname, 'dist/images')
      if (fs.existsSync(imagesDist)) {
        fs.rmSync(imagesDist, { recursive: true, force: true })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), excludeLocalImagesFromBundle()],
})

