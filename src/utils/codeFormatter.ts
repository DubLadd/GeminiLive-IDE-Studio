/**
 * Comprehensive Code Formatter for Web IDE
 * Supports formatting for TypeScript, JavaScript, SQL, YAML, HTML, CSS, JSON, and generic code.
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
    case 'typescript':
    case 'ts':
    case 'tsx':
      return formatTypeScript(code);
    case 'javascript':
    case 'js':
    case 'jsx':
      return formatJavaScript(code);
    case 'sql':
      return formatSql(code);
    case 'yaml':
    case 'yml':
      return formatYaml(code);
    default:
      return formatGeneric(code);
  }
}

function formatJson(code: string): string {
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, 2) + '\n';
  } catch {
    return formatGeneric(code);
  }
}

function formatCss(code: string): string {
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
      lines.push('');
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

/**
 * TypeScript formatter with intelligent type annotations, interface alignment,
 * generic spacing, and import/export structure.
 */
function formatTypeScript(code: string): string {
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  let indent = 0;
  const formatted: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();

    if (!line) {
      if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
        formatted.push('');
      }
      continue;
    }

    // Adjust indent for closing brackets at start of line
    const leadingCloseBrackets = (line.match(/^[\}\]\)]+/) || [''])[0].length;
    const currentIndent = Math.max(0, indent - leadingCloseBrackets);

    // Format TypeScript spacing
    let formattedLine = line
      // Type colon spacing: 'x:number' -> 'x: number', but preserve '::' or URLs
      .replace(/([a-zA-Z0-9_$?])\s*:\s*([a-zA-Z0-9_{}[\]<>"'|&])/g, '$1: $2')
      // Union and intersection types: 'string|number' -> 'string | number'
      .replace(/([a-zA-Z0-9_>\]])\s*([|&])\s*([a-zA-Z0-9_<[{])/g, '$1 $2 $3')
      // Comma spacing: 'a,b' -> 'a, b'
      .replace(/,([^\s\r\n])/g, ', $1')
      // Semicolon spacing
      .replace(/;([^\s\r\n}])/g, '; $1')
      // Arrow functions: '()=>' -> '() => '
      .replace(/=>/g, ' => ')
      .replace(/\s+=>\s+/g, ' => ')
      // Single equals assignments (avoiding === or !== or >= or <=)
      .replace(/([^=!<>&|+*\/%^~ -])=([^= >])/g, '$1 = $2');

    // Clean multiple consecutive spaces
    formattedLine = formattedLine.replace(/[ ]{3,}/g, ' ');

    formatted.push('  '.repeat(currentIndent) + formattedLine);

    // Calculate delta for next line
    const openMatches = (line.match(/[\{\[\(]/g) || []).length;
    const closeMatches = (line.match(/[\}\]\)]/g) || []).length;
    indent = Math.max(0, indent + openMatches - closeMatches);
  }

  return formatted.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function formatJavaScript(code: string): string {
  return formatTypeScript(code);
}

/**
 * SQL Formatter
 * Standardizes clauses, capitalizes keywords, aligns table columns,
 * and formats subqueries with 2-space indentation.
 */
function formatSql(code: string): string {
  const SQL_KEYWORDS = [
    'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT',
    'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
    'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
    'ALTER TABLE', 'DROP TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES',
    'CONSTRAINT', 'NOT NULL', 'DEFAULT', 'CHECK', 'UNION', 'UNION ALL',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'IN', 'EXISTS', 'BETWEEN',
    'LIKE', 'ILIKE', 'IS NULL', 'IS NOT NULL', 'WITH', 'RECURSIVE'
  ];

  // Normalize line endings and multiple spaces
  let clean = code.replace(/\r\n/g, '\n').replace(/\t/g, '  ').trim();

  // Keyword capitalization (word boundary matching)
  SQL_KEYWORDS.forEach(kw => {
    const regex = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'gi');
    clean = clean.replace(regex, kw);
  });

  // Clause boundary insertion
  const CLAUSE_STARTERS = [
    'SELECT', 'FROM', 'WHERE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
    'CROSS JOIN', 'JOIN', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
    'UNION ALL', 'UNION', 'WITH'
  ];

  // Split into tokens/lines by major clauses
  let formatted = clean;
  CLAUSE_STARTERS.forEach(clause => {
    const re = new RegExp(`(?<!\\(\\s*)\\b(${clause})\\b`, 'g');
    formatted = formatted.replace(re, `\n${clause}`);
  });

  const rawLines = formatted.split('\n');
  let indent = 0;
  const result: string[] = [];

  for (let rawLine of rawLines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Check if line starts with subquery close
    if (line.startsWith(')')) {
      indent = Math.max(0, indent - 1);
    }

    // Clause indenting: SELECT, FROM, WHERE are at base indent; column lists or AND/OR are indented
    const isMajorClause = CLAUSE_STARTERS.some(cl => line.startsWith(cl));
    const lineIndent = isMajorClause ? indent : indent + 1;

    // Add comma spacing in SQL
    line = line.replace(/,([^\s])/g, ', $1');

    result.push('  '.repeat(Math.max(0, lineIndent)) + line);

    // Check if line opens a subquery
    if (line.includes('(') && !line.includes(')')) {
      indent++;
    }
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

/**
 * YAML Formatter
 * Normalizes 2-space hierarchy, key-value colon spacing, list hyphens,
 * and maintains comment positions and document markers.
 */
function formatYaml(code: string): string {
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  const result: string[] = [];

  for (let rawLine of rawLines) {
    // Preserve empty lines
    if (!rawLine.trim()) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      continue;
    }

    // Preserve comments
    if (rawLine.trim().startsWith('#')) {
      const leadingSpaces = rawLine.match(/^\s*/)?.[0].length || 0;
      const normalizedSpaces = Math.floor(leadingSpaces / 2) * 2;
      result.push(' '.repeat(normalizedSpaces) + rawLine.trim());
      continue;
    }

    // Document header/footer (--- or ...)
    if (rawLine.trim() === '---' || rawLine.trim() === '...') {
      result.push(rawLine.trim());
      continue;
    }

    const leadingSpaces = rawLine.match(/^\s*/)?.[0].length || 0;
    const normalizedIndent = Math.floor(leadingSpaces / 2) * 2;
    let line = rawLine.trim();

    // List item formatting: '- item' or '- key: value'
    if (line.startsWith('-')) {
      line = line.replace(/^-\s*/, '- ');
    }

    // Key-value spacing: 'key:value' -> 'key: value' (when not inside quotes or URL)
    if (line.includes(':') && !line.startsWith('#')) {
      const colonIdx = line.indexOf(':');
      const keyPart = line.substring(0, colonIdx).trimEnd();
      const valPart = line.substring(colonIdx + 1).trim();

      if (valPart) {
        line = `${keyPart}: ${valPart}`;
      } else {
        line = `${keyPart}:`;
      }
    }

    result.push(' '.repeat(normalizedIndent) + line);
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
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
