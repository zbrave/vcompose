/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'zustand', 'zundo'],
          'flow-vendor': ['@xyflow/react'],
          'ui-vendor': ['framer-motion', 'cmdk', '@ark-ui/react', 'lucide-react'],
          'yaml-vendor': ['yaml', 'react-syntax-highlighter'],
          'ai-vendor': ['ai', '@ai-sdk/anthropic', '@ai-sdk/openai', '@ai-sdk/google'],
          'analytics': ['posthog-js'],
        },
      },
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'packages/**'],
  },
})
