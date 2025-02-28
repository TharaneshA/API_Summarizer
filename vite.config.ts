import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // Copy manifest.json
        fs.copyFileSync(
          path.resolve(__dirname, 'manifest.json'),
          path.resolve(__dirname, 'dist/manifest.json')
        )

        // Copy config.env
        fs.copyFileSync(
          path.resolve(__dirname, 'config.env'),
          path.resolve(__dirname, 'dist/config.env')
        )

        // Create icons directory
        const iconDir = path.resolve(__dirname, 'dist/icons')
        if (!fs.existsSync(iconDir)) {
          fs.mkdirSync(iconDir)
        }

        // Copy icon files
        const iconSizes = ['16', '48', '128']
        iconSizes.forEach(size => {
          fs.copyFileSync(
            path.resolve(__dirname, `icons/icon${size}.png`),
            path.resolve(__dirname, `dist/icons/icon${size}.png`)
          )
        })
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
})