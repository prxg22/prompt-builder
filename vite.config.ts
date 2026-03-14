import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/prompt-builder/' : '/',
  plugins: [preact(), tailwindcss()],
}))
