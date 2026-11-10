import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// base './' lets the built site work from any sub-path (static hosting).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
