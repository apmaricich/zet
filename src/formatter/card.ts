/**
 * Index card text formatter.
 *
 * Reads plain text, detects list-style items, wraps lines to card width,
 * and produces output bounded by the card dimensions.
 */

import { getCardDimensions } from '../config/config';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface CardConfig {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// List detection
// ---------------------------------------------------------------------------

/** Regex for numbered list items: "1. text" */
const NUMBERED_RE = /^(\d+)\.\s+/;

/** Regex for circular bullet items: "• text" */
const BULLET_RE = /^•\s+/;

/** Regex for arrow items: "-> text" */
const ARROW_RE = /^->\s+/;

interface ListHeader {
  type: 'numbered' | 'bullet' | 'arrow';
  width: number; // character width of the header itself
}

function detectListHeader(line: string): ListHeader | null {
  // Match numbered list: "1. ", "10. ", "100. "
  const numberedMatch = line.match(/^(\d+\.\s+)/);
  if (numberedMatch) {
    return { type: 'numbered', width: numberedMatch[1].length };
  }

  if (BULLET_RE.test(line)) {
    return { type: 'bullet', width: 2 }; // "• "
  }
  if (ARROW_RE.test(line)) {
    return { type: 'arrow', width: 3 }; // "-> "
  }
  return null;
}

// ---------------------------------------------------------------------------
// Wrapping
// ---------------------------------------------------------------------------

/**
 * Split `text` into chunks of at most `maxChars` characters, breaking on
 * spaces where possible. Returns an array of lines.
 */
function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const lines: string[] = [];
  let remaining = text;

  while (remaining.length > maxChars) {
    // Find the last space within the allowed width
    let breakAt = remaining.lastIndexOf(' ', maxChars);
    if (breakAt === -1) {
      // No space found; force break at maxChars
      breakAt = maxChars;
    }

    lines.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).replace(/^ +/, '');
  }

  if (remaining.length > 0) {
    lines.push(remaining);
  }

  return lines;
}

/**
 * Split a line on list item markers and return an array of items.
 * Each item is a separate line that will be formatted individually.
 */
function splitOnListItems(line: string): string[] {
  const items: string[] = [];
  let current = '';
  let i = 0;

  while (i < line.length) {
    // Check for numbered list marker: "1. ", "2. ", etc.
    if (line[i].match(/[0-9]/) && line[i + 1] === '.' && line[i + 2] === ' ') {
      // Always split on numbered list markers
      items.push(current);
      current = line[i] + line[i + 1] + line[i + 2];
      i += 3;
    } else if (line[i] === '•' && line[i + 1] === ' ') {
      // Always split on bullet list markers
      items.push(current);
      current = line[i] + line[i + 1];
      i += 2;
    } else if (line[i] === '-' && line[i + 1] === '>' && line[i + 2] === ' ') {
      // Always split on arrow list markers
      items.push(current);
      current = line[i] + line[i + 1] + line[i + 2];
      i += 3;
    } else {
      current += line[i];
      i++;
    }
  }

  items.push(current);
  return items;
}

/**
 * Format a single content line for a card, wrapping as needed.
 *
 * List items (numbered, bullet, arrow) are detected. When an item wraps,
 * continuation lines are indented by the header width.
 */
function formatLine(line: string, config: CardConfig): string[] {
  // Split on list item markers
  const items = splitOnListItems(line);

  const result: string[] = [];

  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const header = detectListHeader(trimmed);
    if (!header) {
      // Not a list item, just wrap normally
      result.push(...wrapText(trimmed, config.width));
    } else {
      // For list items, indent by 2 spaces and wrap content
      const content = trimmed.replace(/^(?:\d+\.|•|->)\s+/, '');
      const wrapped = wrapText(content, config.width - 2);

      result.push('  ' + trimmed);
      for (let i = 1; i < wrapped.length; i++) {
        result.push(' '.repeat(header.width + 2) + wrapped[i]);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Card layout
// ---------------------------------------------------------------------------

/**
 * Format the full card. Returns an array of `height` lines, each `width`
 * characters. Content is trimmed to fit; overflow is silently discarded.
 */
export function formatCard(text: string, config?: CardConfig): string[] {
  const cfg = config ?? getCardDimensions();

  // Find the footer (last non-empty line)
  const lines = text.split(/\r?\n/);
  let footerLine = '';
  let hasFooter = false;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() !== '') {
      footerLine = lines[i].trim();
      hasFooter = true;
      lines[i] = '';
      break;
    }
  }

  const formattedLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      // Preserve blank lines
      formattedLines.push('');
    } else {
      const parts = formatLine(line, cfg);
      for (const part of parts) {
        // Force clip if over width
        const clipped = part.length > cfg.width ? part.slice(0, cfg.width) : part;
        formattedLines.push(clipped);
      }
    }
  }

  // Fit to card height, placing footer on last line
  const result: string[] = [];
  for (let i = 0; i < cfg.height; i++) {
    if (i === cfg.height - 1 && hasFooter) {
      // Last line: place footer
      result.push(footerLine.padEnd(cfg.width, ' '));
    } else if (i < formattedLines.length) {
      // Pad to width
      result.push(formattedLines[i].padEnd(cfg.width, ' '));
    } else {
      result.push(' '.repeat(cfg.width));
    }
  }

  return result;
}

/**
 * Format the card and render to a string suitable for terminal display.
 */
export function formatCardToString(text: string, config?: CardConfig): string {
  const lines = formatCard(text, config);
  return lines.join('\n');
}
