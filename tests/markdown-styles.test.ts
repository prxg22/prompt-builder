import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('markdown preview styles', () => {
  it('defines explicit list markers for ordered and unordered lists', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'src/styles/app.css'), 'utf8')

    expect(stylesheet).toMatch(/\.markdown-body ul\s*\{[^}]*list-style-type:\s*disc;/s)
    expect(stylesheet).toMatch(/\.markdown-body ol\s*\{[^}]*list-style-type:\s*decimal;/s)
  })
})
