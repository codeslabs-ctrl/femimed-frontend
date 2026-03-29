import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as PurifyModule from 'dompurify';

type PurifyConfig = import('dompurify').Config;

/** Compatible con dompurify CJS (`export =`) sin `allowSyntheticDefaultImports` en tsconfig. */
function sanitizeHtml(dirty: string, cfg: PurifyConfig): string {
  const mod = PurifyModule as unknown as {
    default?: { sanitize: (d: string, c: PurifyConfig) => string };
    sanitize?: (d: string, c: PurifyConfig) => string;
  };
  const impl = mod.default ?? (mod as { sanitize: (d: string, c: PurifyConfig) => string });
  if (typeof impl.sanitize !== 'function') {
    throw new Error('dompurify: sanitize no disponible');
  }
  return impl.sanitize(dirty, cfg);
}

/** Escapa HTML y aplica un subconjunto tipo Markdown (negritas, código, listas) para respuestas del asistente. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(escaped: string): string {
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function splitTableRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map((c) => c.trim());
}

function isTableDelimiterRow(line: string): boolean {
  const cells = splitTableRow(line);
  return (
    cells.length >= 2 &&
    cells.every((c) => {
      const x = c.replace(/\s/g, '');
      return /^:?-{3,}:?$/.test(x);
    })
  );
}

function markdownTableBlockToHtml(block: string): string | null {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;
  if (!lines.every((l) => l.includes('|'))) return null;
  if (!isTableDelimiterRow(lines[1])) return null;
  const headerCells = splitTableRow(lines[0]);
  if (headerCells.length < 2) return null;
  const ths = headerCells.map((c) => `<th>${formatInline(escapeHtml(c))}</th>`).join('');
  const bodyRows = lines.slice(2);
  const tbody = bodyRows
    .map((row) => {
      let cells = splitTableRow(row);
      while (cells.length < headerCells.length) cells.push('');
      cells = cells.slice(0, headerCells.length);
      const tds = cells.map((c) => `<td>${formatInline(escapeHtml(c))}</td>`).join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
  return `<table><thead><tr>${ths}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function chatMarkdownToHtml(text: string): string {
  const raw = (text || '').trim();
  if (!raw) return '';

  const blocks = raw.split(/\n{2,}/);
  const out: string[] = [];

  for (const block of blocks) {
    const tableHtml = markdownTableBlockToHtml(block);
    if (tableHtml) {
      out.push(tableHtml);
      continue;
    }

    const lines = block.split('\n');
    const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
    const allBullets =
      nonEmpty.length > 0 && nonEmpty.every((l) => /^[-*•]\s+/.test(l));

    if (allBullets) {
      const items = nonEmpty.map((l) => l.replace(/^[-*•]\s+/, ''));
      out.push(
        '<ul>' +
          items.map((i) => `<li>${formatInline(escapeHtml(i))}</li>`).join('') +
          '</ul>'
      );
      continue;
    }

    const escapedBlock = escapeHtml(block);
    const withBreaks = escapedBlock.split('\n').map((line) => formatInline(line)).join('<br>');
    out.push(`<p>${withBreaks}</p>`);
  }

  return out.join('');
}

@Pipe({
  name: 'chatMarkdown',
  standalone: true
})
export class ChatMarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (value == null || value === '') {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    const html = chatMarkdownToHtml(value);
    const clean = sanitizeHtml(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: []
    });
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
