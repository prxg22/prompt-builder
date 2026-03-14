import { marked } from 'marked'

const VARIABLE_PATTERN = /\{\{vars:\/\/([^/]+)\/\}\}/g

export function highlightVariables(html: string): string {
  return html.replace(
    VARIABLE_PATTERN,
    '<span class="prompt-var" data-var-id="$1">{{vars://$1/}}</span>'
  )
}

export function renderMarkdown(source: string): string {
  const html = marked.parse(source, { async: false }) as string
  return highlightVariables(html)
}
