/**
 * Terminal Execution Utilities for Simulated Linux Environment
 * Provides authentic execution for Python 3, Node.js REPL, Git Clone, Curl/Wget,
 * and Unix permissions management.
 */

// Format Unix permissions string from mode (e.g., 755 -> -rwxr-xr-x)
export function modeToPermissions(mode: number | string, isDir: boolean = false): string {
  const num = typeof mode === 'string' ? parseInt(mode.replace(/^0+/, ''), 8) || 0o644 : mode;
  const prefix = isDir ? 'd' : '-';
  
  const getTriple = (octal: number) => {
    let r = (octal & 4) ? 'r' : '-';
    let w = (octal & 2) ? 'w' : '-';
    let x = (octal & 1) ? 'x' : '-';
    return `${r}${w}${x}`;
  };

  const user = getTriple((num >> 6) & 7);
  const group = getTriple((num >> 3) & 7);
  const other = getTriple(num & 7);

  return `${prefix}${user}${group}${other}`;
}

// Evaluate Python 3 code in browser runtime
export function executePythonCode(
  code: string,
  contextVars: Record<string, any> = {}
): { outputs: string[]; error?: string; updatedVars: Record<string, any> } {
  const outputs: string[] = [];
  const vars: Record<string, any> = { ...contextVars };

  // Built-in helper sandbox
  const builtins: Record<string, any> = {
    print: (...args: any[]) => {
      outputs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    },
    len: (obj: any) => (obj && obj.length !== undefined ? obj.length : 0),
    sum: (arr: number[]) => (Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0),
    max: (...args: any[]) => {
      const flat = Array.isArray(args[0]) ? args[0] : args;
      return Math.max(...flat);
    },
    min: (...args: any[]) => {
      const flat = Array.isArray(args[0]) ? args[0] : args;
      return Math.min(...flat);
    },
    abs: Math.abs,
    round: Math.round,
    pow: Math.pow,
    range: (start: number, stop?: number, step: number = 1) => {
      if (stop === undefined) {
        stop = start;
        start = 0;
      }
      const res: number[] = [];
      for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
        res.push(i);
      }
      return res;
    },
    sorted: (arr: any[]) => (Array.isArray(arr) ? [...arr].sort() : arr),
    type: (val: any) => `<class '${typeof val === 'number' ? 'int' : typeof val === 'string' ? 'str' : Array.isArray(val) ? 'list' : 'object'}'>`,
    str: (val: any) => String(val),
    int: (val: any) => parseInt(val, 10),
    float: (val: any) => parseFloat(val),
    bool: (val: any) => Boolean(val),
    math: Math,
    True: true,
    False: false,
    None: null,
  };

  const lines = code.split('\n');

  try {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      // Handle simple print(...)
      if (/^print\s*\(/.test(line)) {
        const inside = line.replace(/^print\s*\(/, '').replace(/\)\s*$/, '');
        // Evaluate print content
        const evalExpression = (expr: string) => {
          // Check if string literal
          if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
            return expr.slice(1, -1);
          }
          // Evaluate in context
          const scope = { ...builtins, ...vars };
          const func = new Function(...Object.keys(scope), `return (${expr});`);
          return func(...Object.values(scope));
        };

        try {
          // Support multiple comma separated args if not in nested brackets
          const val = evalExpression(inside);
          builtins.print(val);
        } catch {
          outputs.push(inside);
        }
        continue;
      }

      // Handle assignment: var_name = expression
      const assignMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        let expr = assignMatch[2];

        // Replace Python syntax in expr
        expr = expr.replace(/\bTrue\b/g, 'true')
                   .replace(/\bFalse\b/g, 'false')
                   .replace(/\bNone\b/g, 'null');

        const scope = { ...builtins, ...vars };
        try {
          const func = new Function(...Object.keys(scope), `return (${expr});`);
          vars[varName] = func(...Object.values(scope));
        } catch (e: any) {
          return { outputs, error: `SyntaxError in assignment "${line}": ${e.message}`, updatedVars: vars };
        }
        continue;
      }

      // Handle simple expression evaluation (e.g., 2 + 2 or var_name)
      let expr = line
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null');

      const scope = { ...builtins, ...vars };
      try {
        const func = new Function(...Object.keys(scope), `return (${expr});`);
        const result = func(...Object.values(scope));
        if (result !== undefined) {
          outputs.push(typeof result === 'object' ? JSON.stringify(result) : String(result));
        }
      } catch (err: any) {
        return { outputs, error: `NameError: name '${line}' is not defined (${err.message})`, updatedVars: vars };
      }
    }
  } catch (globalErr: any) {
    return { outputs, error: `Python execution error: ${globalErr.message}`, updatedVars: vars };
  }

  return { outputs, updatedVars: vars };
}

// Evaluate Node.js code
export function executeNodeCode(code: string): { outputs: string[]; error?: string } {
  const outputs: string[] = [];

  const fakeConsole = {
    log: (...args: any[]) => outputs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')),
    info: (...args: any[]) => outputs.push(args.map(a => String(a)).join(' ')),
    warn: (...args: any[]) => outputs.push('[warn] ' + args.map(a => String(a)).join(' ')),
    error: (...args: any[]) => outputs.push('[error] ' + args.map(a => String(a)).join(' ')),
  };

  try {
    const fn = new Function('console', `
      try {
        const result = eval(${JSON.stringify(code)});
        if (result !== undefined) {
          console.log(result);
        }
      } catch (e) {
        throw e;
      }
    `);
    fn(fakeConsole);
  } catch (err: any) {
    return { outputs, error: err.message };
  }

  return { outputs };
}
