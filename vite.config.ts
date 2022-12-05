import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import * as packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true
    }),
    react()
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    // Running build script will create the library
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'orbis-modules',
      formats: ['es', 'umd'],
      fileName: (format) => `orbis-modules.${format}.js`
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)]
    }
  }
})
