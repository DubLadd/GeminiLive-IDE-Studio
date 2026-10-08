/**
 * Lightweight, regex and state-machine based code formatter for
 * JavaScript, CSS, HTML, and JSON.
 */

export function formatCode(code: string, language: string): string {
  if (!code || !code.trim()) return code;

  switch (language.toLowerCase()) {
    case 'json':
      return formatJson(code);
    case 'css':
      return formatCss(code);
    case 'html':
      return formatHtml(code);
    case 'javascript':
    case 'typescript':
    case 'js':
    case 'ts':
      return formatJavaScript(code);
    default:
      return formatGeneric(code);
  }
}

function formatJson(code: string): string {
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If invalid JSON, clean up whitespace lines
    return formatGeneric(code);
  }
}

function formatCss(code: string): string {
  // Normalize whitespace
  let clean = code
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\s*([\{\};:])\s*/g, '$1')
    .replace(/\s+/g, ' ');

  let indent = 0;
  const lines: string[] = [];
  let buffer = '';

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];

    if (char === '{') {
      buffer = buffer.trim();
      lines.push('  '.repeat(indent) + buffer + ' {');
      buffer = '';
      indent++;
    } else if (char === '}') {
      if (buffer.trim()) {
        lines.push('  '.repeat(indent) + buffer.trim() + (buffer.trim().endsWith(';') ? '' : ';'));
        buffer = '';
      }
      indent = Math.max(0, indent - 1);
      lines.push('  '.repeat(indent) + '}');
      lines.push(''); // blank line after block
    } else if (char === ';') {
      buffer += char;
      lines.push('  '.repeat(indent) + buffer.trim());
      buffer = '';
    } else if (char === ':') {
      buffer += ': ';
    } else {
      buffer += char;
    }
  }

  if (buffer.trim()) {
    lines.push('  '.repeat(indent) + buffer.trim());
  }

  // Clean extra blank lines
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}

function formatHtml(code: string): string {
  const tokens = code
    .replace(/\r\n/g, '\n')
    .replace(/>\s*</g, '>\n<')
    .split('\n');

  let indent = 0;
  const result: string[] = [];
  const selfClosing = /^(<area|<base|<br|<col|<embed|<hr|<img|<input|<link|<meta|<param|<source|<track|<wbr|<!DOCTYPE|<!--)/i;

  for (let rawLine of tokens) {
    let line = rawLine.trim();
    if (!line) continue;

    // Check if line is closing tag
    const isClosing = line.startsWith('</');
    const isSelfClosing = selfClosing.test(line) || line.endsWith('/>');
    const isOpening = line.startsWith('<') && !isClosing && !isSelfClosing;

    if (isClosing) {
      indent = Math.max(0, indent - 1);
    }

    result.push('  '.repeat(indent) + line);

    if (isOpening) {
      indent++;
    }
  }

  return result.join('\n') + '\n';
}

function formatJavaScript(code: string): string {
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  let indent = 0;
  const formatted: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();

    if (!line) {
      // Don't add multiple empty lines
      if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
        formatted.push('');
      }
      continue;
    }

    // Adjust indent for closing brackets at start of line
    const leadingCloseBrackets = (line.match(/^[\}\]\)]+/) || [''])[0].length;
    const currentIndent = Math.max(0, indent - leadingCloseBrackets);

    // Format operators spacing: e.g. "a=b" -> "a = b", but avoid "===" or "=>" messes
    let formattedLine = line
      .replace(/([^=!<>\s])=([^=])/g, '$1 = $2')
      .replace(/,([^\s])/g, ', $1')
      .replace(/:\s*([^\s])/g, ': $1');

    formatted.push('  '.repeat(currentIndent) + formattedLine);

    // Calculate delta for next line
    const openMatches = (line.match(/[\{\[\(]/g) || []).length;
    const closeMatches = (line.match(/[\}\]\)]/g) || []).length;
    indent = Math.max(0, indent + openMatches - closeMatches);
  }

  return formatted.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function formatGeneric(code: string): string {
  return code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}
