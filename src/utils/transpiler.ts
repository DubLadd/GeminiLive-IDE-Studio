/**
 * Multi-Language Live IDE Transpiler Engine
 * Transpiles TypeScript (.ts, .tsx) and modern ES modules in-browser
 * so that HTML, TypeScript, and JavaScript can preview live instantly.
 */

/**
 * Strips TypeScript types, interfaces, type aliases, and enums from code
 * without needing a bulky node build step.
 */
export function fastTranspileTypeScript(tsCode: string): string {
  try {
    let code = tsCode;

    // 1. Remove single-line and multi-line interface declarations
    code = code.replace(/interface\s+[A-Za-z0-9_$]+(?:\s*<[^>]+>)?(?:\s+extends\s+[^{]+)?\s*\{[^}]*\}/g, '');

    // 2. Remove type alias statements: type Foo = ...;
    code = code.replace(/type\s+[A-Za-z0-9_$]+(?:\s*<[^>]+>)?\s*=\s*[^;]+;/g, '');

    // 3. Remove 'export interface' and 'export type'
    code = code.replace(/export\s+interface\s+[A-Za-z0-9_$]+(?:\s*<[^>]+>)?(?:\s+extends\s+[^{]+)?\s*\{[^}]*\}/g, '');
    code = code.replace(/export\s+type\s+[A-Za-z0-9_$]+(?:\s*<[^>]+>)?\s*=\s*[^;]+;/g, '');

    // 4. Remove TypeScript type imports: import type { ... } from '...';
    code = code.replace(/import\s+type\s+[^;]+;/g, '');

    // 5. Remove 'as Type' casts (e.g., 'as string', 'as HTMLCanvasElement', 'as const')
    code = code.replace(/\s+as\s+[A-Za-z0-9_$<>\[\]|&\s]+(?=[,;\)\}\]\s\.\:\=]|$)/g, ' ');

    // 6. Remove generic parameter calls: foo<T>(...) -> foo(...)
    // Be conservative: only match identifiers followed immediately by <Type> and (
    code = code.replace(/([A-Za-z0-9_$]+)<[A-Za-z0-9_$,\s\[\]|&]+>\s*\(/g, '$1(');

    // 7. Strip function parameter type annotations: (a: string, b: number = 5) -> (a, b = 5)
    // Matches param: Type, but not object literal properties { a: 1 }
    // Match in function declarations and arrow functions
    code = code.replace(/(\(\s*[A-Za-z0-9_$\s,]+?):(?:\s*[A-Za-z0-9_$<>\[\]|&]+)(\s*[,\)])/g, '$1$2');

    // 8. Strip function return types: ): string => or ): Promise<void> {
    code = code.replace(/\)\s*:\s*(?:[A-Za-z0-9_$<>\[\]|&\s]+)\s*(=>|\{)/g, ') $1');

    // 9. Strip variable type annotations: const x: number = 5 -> const x = 5
    code = code.replace(/(const|let|var)\s+([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_$<>\[\]|&]+\s*=/g, '$1 $2 =');

    // 10. Strip class field type annotations: public name: string = 'test';
    code = code.replace(/(public|private|protected|readonly)?\s*([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_$<>\[\]|&]+\s*;/g, '$2;');

    return code;
  } catch (err) {
    console.warn('Fast TypeScript transpile failed, returning raw code', err);
    return tsCode;
  }
}

/**
 * Builds the complete HTML bundle containing HTML, CSS, JavaScript, and TypeScript.
 * Injects Babel Standalone CDN script for flawless JSX/TSX support when connected,
 * with fastTranspileTypeScript as reliable offline backup.
 */
export function bundleLivePreviewDocument(files: Array<{ name: string; content: string; language: string }>): string {
  const htmlFile = files.find(f => f.name === 'index.html' || f.language === 'html') || files.find(f => f.name.endsWith('.html'));
  const cssFiles = files.filter(f => f.name.endsWith('.css') || f.language === 'css');
  const jsAndTsFiles = files.filter(f =>
    f.name.endsWith('.js') ||
    f.name.endsWith('.ts') ||
    f.name.endsWith('.tsx') ||
    f.name.endsWith('.jsx') ||
    f.language === 'javascript' ||
    f.language === 'typescript'
  );

  let baseHtml = htmlFile ? htmlFile.content : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gemini Live Canvas Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans antialiased">
  <div id="root" class="max-w-3xl mx-auto"></div>
</body>
</html>`;

  // Intercept console script
  const consoleInterceptor = `
    <script>
      (function() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        function formatArg(arg) {
          try {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
            return String(arg);
          } catch(e) {
            return String(arg);
          }
        }

        console.log = function(...args) {
          originalLog.apply(console, args);
          window.parent.postMessage({
            type: 'IDE_CONSOLE',
            logType: 'log',
            text: args.map(formatArg).join(' ')
          }, '*');
        };

        console.warn = function(...args) {
          originalWarn.apply(console, args);
          window.parent.postMessage({
            type: 'IDE_CONSOLE',
            logType: 'warn',
            text: args.map(formatArg).join(' ')
          }, '*');
        };

        console.error = function(...args) {
          originalError.apply(console, args);
          window.parent.postMessage({
            type: 'IDE_CONSOLE',
            logType: 'error',
            text: args.map(formatArg).join(' ')
          }, '*');
        };

        window.onerror = function(msg, url, lineNo, columnNo, error) {
          window.parent.postMessage({
            type: 'IDE_CONSOLE',
            logType: 'error',
            text: 'Runtime Error: ' + msg + (lineNo ? ' (Line ' + lineNo + ':' + columnNo + ')' : '')
          }, '*');
          return false;
        };

        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'EXEC_COMMAND') {
            try {
              const res = window.eval(e.data.cmd);
              console.log('Result: ' + formatArg(res));
            } catch(err) {
              console.error(err.message || String(err));
            }
          }
        });
      })();
    </script>
  `;

  // Inject styles
  const stylesBlock = cssFiles
    .map(cf => `<style data-filename="${cf.name}">\n${cf.content}\n</style>`)
    .join('\n');

  // React and Babel standalone CDN scripts to support TSX/JSX & TypeScript in browser
  const reactAndBabelTags = `
    <!-- Babel & React Standalone for Live TypeScript & TSX compilation -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  `;

  // Prepare scripts:
  // For each script, if it's TS/TSX, emit a script tag with type="text/babel" and presets="typescript,react,env"
  // Also provide transpiled fallback
  const scriptsBlock = jsAndTsFiles
    .map(file => {
      const isTsOrJsx = file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.jsx') || file.language === 'typescript';

      if (isTsOrJsx) {
        return `
    <script type="text/babel" data-presets="typescript,react,env" data-filename="${file.name}">
      ${file.content}
    </script>
    <script>
      // Fallback if Babel fails to load
      if (!window.Babel) {
        try {
          const transpiled = ${JSON.stringify(fastTranspileTypeScript(file.content))};
          const fn = new Function(transpiled);
          fn();
        } catch(e) {
          console.error("Local TS execution failed for ${file.name}:", e);
        }
      }
    </script>
        `;
      } else {
        return `<script data-filename="${file.name}">\n${file.content}\n</script>`;
      }
    })
    .join('\n');

  let finalHtml = baseHtml;

  // Insert console interceptor and styles into <head> or at beginning
  if (finalHtml.includes('<head>')) {
    finalHtml = finalHtml.replace('<head>', `<head>\n${consoleInterceptor}\n${stylesBlock}`);
  } else {
    finalHtml = `${consoleInterceptor}\n${stylesBlock}\n${finalHtml}`;
  }

  // Insert React/Babel & scripts before </body> or at the end
  if (finalHtml.includes('</body>')) {
    finalHtml = finalHtml.replace('</body>', `${reactAndBabelTags}\n${scriptsBlock}\n</body>`);
  } else {
    finalHtml += `\n${reactAndBabelTags}\n${scriptsBlock}`;
  }

  return finalHtml;
}
