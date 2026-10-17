/**
 * Lightweight In-Browser Vitest Test Runner Engine
 * Executes .test.ts, .test.js, .spec.ts, .spec.js files in-browser
 * with full Vitest assertion suite (describe, it, test, expect, vi).
 */
import { ProjectFile } from '../types/ide';
import { fastTranspileTypeScript } from './transpiler';

export interface TestCaseResult {
  id: string;
  name: string;
  suiteName: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration: number; // in ms
  error?: string;
  expected?: string;
  actual?: string;
  stack?: string;
  logs?: string[];
}

export interface TestSuiteResult {
  name: string;
  tests: TestCaseResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestFileResult {
  fileId: string;
  fileName: string;
  suites: TestSuiteResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
  rawOutput: string;
}

export interface TestRunSummary {
  fileResults: TestFileResult[];
  totalFiles: number;
  passedFiles: number;
  failedFiles: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  timestamp: string;
}

/**
 * Filter project files for test suites
 */
export function findTestFiles(files: ProjectFile[]): ProjectFile[] {
  const testPattern = /\.(test|spec)\.(ts|js|tsx|jsx)$/i;
  return files.filter(f => testPattern.test(f.name) || f.name.includes('/__tests__/'));
}

/**
 * Custom Deep Equality comparison helper
 */
function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

function stringifySafe(val: any): string {
  try {
    if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
    if (val === undefined) return 'undefined';
    if (typeof val === 'symbol') return val.toString();
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

/**
 * Build expect matchers for Vitest compatibility
 */
function createExpect(actual: any, isNot = false): any {
  const matchers = {
    toBe(expected: any) {
      const pass = Object.is(actual, expected);
      if (isNot ? pass : !pass) {
        const err: any = new Error(
          isNot
            ? `Expected value NOT to be: ${stringifySafe(expected)}`
            : `Expected: ${stringifySafe(expected)}\nReceived: ${stringifySafe(actual)}`
        );
        err.expected = stringifySafe(expected);
        err.actual = stringifySafe(actual);
        throw err;
      }
    },
    toEqual(expected: any) {
      const pass = deepEqual(actual, expected);
      if (isNot ? pass : !pass) {
        const err: any = new Error(
          isNot
            ? `Expected deep inequality with: ${stringifySafe(expected)}`
            : `Expected deep equality:\nExpected: ${stringifySafe(expected)}\nReceived: ${stringifySafe(actual)}`
        );
        err.expected = stringifySafe(expected);
        err.actual = stringifySafe(actual);
        throw err;
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected value ${isNot ? 'to be undefined' : 'to be defined'}, received ${stringifySafe(actual)}`);
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected value ${isNot ? 'NOT to be undefined' : 'to be undefined'}, received ${stringifySafe(actual)}`);
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected value ${isNot ? 'NOT to be null' : 'to be null'}, received ${stringifySafe(actual)}`);
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (isNot ? pass : !pass) {
        throw new Error(`Expected truthy value, received: ${stringifySafe(actual)}`);
      }
    },
    toBeFalsy() {
      const pass = !actual;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected falsy value, received: ${stringifySafe(actual)}`);
      }
    },
    toContain(item: any) {
      let pass = false;
      if (typeof actual === 'string' || Array.isArray(actual)) {
        pass = actual.includes(item);
      }
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${stringifySafe(actual)} ${isNot ? 'NOT to contain' : 'to contain'} ${stringifySafe(item)}`);
      }
    },
    toHaveLength(expectedLen: number) {
      const len = actual?.length ?? (typeof actual === 'object' && actual !== null ? Object.keys(actual).length : undefined);
      const pass = len === expectedLen;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected length ${expectedLen}, but received length ${len}`);
      }
    },
    toBeGreaterThan(num: number) {
      const pass = typeof actual === 'number' && actual > num;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? '<=' : '>'} ${num}`);
      }
    },
    toBeGreaterThanOrEqual(num: number) {
      const pass = typeof actual === 'number' && actual >= num;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? '<' : '>='} ${num}`);
      }
    },
    toBeLessThan(num: number) {
      const pass = typeof actual === 'number' && actual < num;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? '>=' : '<'} ${num}`);
      }
    },
    toBeLessThanOrEqual(num: number) {
      const pass = typeof actual === 'number' && actual <= num;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? '>' : '<='} ${num}`);
      }
    },
    toBeCloseTo(expected: number, precision = 2) {
      const pass = Math.abs(actual - expected) < Math.pow(10, -precision) / 2;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} to be close to ${expected} (precision: ${precision})`);
      }
    },
    toMatch(pattern: string | RegExp) {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      const pass = regex.test(String(actual));
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${stringifySafe(actual)} to match ${pattern}`);
      }
    },
    toThrow(expectedError?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new Error('toThrow requires a function operand: expect(() => ...).toThrow()');
      }
      let threw = false;
      let thrownError: any = null;
      try {
        actual();
      } catch (err: any) {
        threw = true;
        thrownError = err;
      }

      if (!threw && !isNot) {
        throw new Error('Expected function to throw an error, but it returned without throwing.');
      }
      if (threw && isNot) {
        throw new Error(`Expected function NOT to throw, but it threw: ${thrownError?.message || thrownError}`);
      }
      if (threw && expectedError) {
        const msg = thrownError?.message || String(thrownError);
        const matches = typeof expectedError === 'string' ? msg.includes(expectedError) : expectedError.test(msg);
        if (!matches) {
          throw new Error(`Expected error matching "${expectedError}", but got "${msg}"`);
        }
      }
    },
    toHaveBeenCalled() {
      const pass = actual?._mockCalls?.length > 0;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected mock function ${isNot ? 'NOT to have been called' : 'to have been called'}`);
      }
    },
    toHaveBeenCalledTimes(n: number) {
      const count = actual?._mockCalls?.length || 0;
      const pass = count === n;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected mock function to be called ${n} times, but was called ${count} times.`);
      }
    },
    toHaveBeenCalledWith(...args: any[]) {
      const calls: any[][] = actual?._mockCalls || [];
      const pass = calls.some(callArgs => deepEqual(callArgs, args));
      if (isNot ? pass : !pass) {
        throw new Error(`Expected mock function to be called with ${stringifySafe(args)}`);
      }
    },
  };

  if (!isNot) {
    (matchers as any).not = createExpect(actual, true);
  }

  return matchers;
}

/**
 * Vi Mocking Utilities
 */
const vi = {
  fn(impl?: (...args: any[]) => any) {
    const mock = function (...args: any[]) {
      mock._mockCalls.push(args);
      if (impl) return impl(...args);
    };
    mock._mockCalls = [] as any[][];
    return mock;
  },
  spyOn(obj: any, method: string) {
    const original = obj[method];
    const mock = vi.fn(original);
    obj[method] = mock;
    return mock;
  },
  useFakeTimers() {},
  useRealTimers() {},
  advanceTimersByTime(_ms: number) {},
};

/**
 * Executes a single test file using Vitest in-browser sandbox
 */
export async function executeTestFile(
  testFile: ProjectFile,
  allFiles: ProjectFile[]
): Promise<TestFileResult> {
  const startFileTime = performance.now();
  const suites: TestSuiteResult[] = [];
  const rawLogs: string[] = [];

  let currentSuite: { name: string; tests: Array<{ name: string; fn: () => any | Promise<any> }> } | null = null;
  const rootTests: Array<{ name: string; fn: () => any | Promise<any> }> = [];
  const suiteDefs: Array<{ name: string; tests: Array<{ name: string; fn: () => any | Promise<any> }> }> = [];

  const beforeEaches: Array<() => any | Promise<any>> = [];
  const afterEaches: Array<() => any | Promise<any>> = [];

  // Register describe & it hooks
  const describe = (suiteName: string, suiteFn: () => void) => {
    const parentSuite = currentSuite;
    const newSuite = { name: suiteName, tests: [] };
    currentSuite = newSuite;
    suiteDefs.push(newSuite);
    try {
      suiteFn();
    } catch (err) {
      console.warn(`Error running describe block "${suiteName}":`, err);
    }
    currentSuite = parentSuite;
  };

  const it = (testName: string, testFn: () => any | Promise<any>) => {
    if (currentSuite) {
      currentSuite.tests.push({ name: testName, fn: testFn });
    } else {
      rootTests.push({ name: testName, fn: testFn });
    }
  };

  const test = it;
  const beforeEach = (fn: () => any) => beforeEaches.push(fn);
  const afterEach = (fn: () => any) => afterEaches.push(fn);
  const beforeAll = (fn: () => any) => fn();
  const afterAll = (_fn: () => any) => {};

  // Clean / Transpile test code (strip TS annotations, remove imports of vitest)
  let cleanCode = testFile.content || '';
  cleanCode = cleanCode.replace(/import\s+\{[^}]*\}\s+from\s+['"]vitest['"];?/g, '');
  cleanCode = cleanCode.replace(/import\s+type\s+[^;]+;/g, '');

  // Extract possible helper exports from other files in the project
  const moduleContext: Record<string, any> = {};
  allFiles.forEach(f => {
    if (f.id !== testFile.id && (f.name.endsWith('.js') || f.name.endsWith('.ts'))) {
      const baseName = f.name.replace(/\.[^/.]+$/, '').split('/').pop() || f.name;
      moduleContext[baseName] = {};
    }
  });

  const transpiled = fastTranspileTypeScript(cleanCode);

  // Compile and evaluate test definitions
  try {
    const fn = new Function(
      'describe',
      'it',
      'test',
      'expect',
      'beforeEach',
      'afterEach',
      'beforeAll',
      'afterAll',
      'vi',
      transpiled
    );
    fn(describe, it, test, (val: any) => createExpect(val), beforeEach, afterEach, beforeAll, afterAll, vi);
  } catch (parseErr: any) {
    const duration = Math.round(performance.now() - startFileTime);
    return {
      fileId: testFile.id,
      fileName: testFile.name,
      suites: [
        {
          name: 'Syntax / Parse Error',
          tests: [
            {
              id: `${testFile.id}-syntax-err`,
              name: 'Parse test suite definition',
              suiteName: 'Syntax / Parse Error',
              status: 'failed',
              duration,
              error: parseErr.message || 'Syntax error in test file',
              stack: parseErr.stack,
            },
          ],
          duration,
          passed: 0,
          failed: 1,
          skipped: 0,
        },
      ],
      duration,
      passed: 0,
      failed: 1,
      skipped: 0,
      rawOutput: `FAIL  ${testFile.name}\n  ● Syntax / Parse Error: ${parseErr.message}\n`,
    };
  }

  // If there are root tests not inside describe
  if (rootTests.length > 0) {
    suiteDefs.unshift({ name: 'Default Suite', tests: rootTests });
  }

  // Execute all collected tests sequentially
  let filePassed = 0;
  let fileFailed = 0;
  let fileSkipped = 0;

  for (const suiteDef of suiteDefs) {
    const startSuiteTime = performance.now();
    const suiteTestResults: TestCaseResult[] = [];

    for (const testDef of suiteDef.tests) {
      const testId = `${testFile.id}-${suiteDef.name}-${testDef.name}`.replace(/\s+/g, '-');
      const startTestTime = performance.now();
      let status: 'passed' | 'failed' = 'passed';
      let errorMsg: string | undefined;
      let expectedStr: string | undefined;
      let actualStr: string | undefined;
      let stackStr: string | undefined;

      try {
        // Run beforeEach
        for (const be of beforeEaches) await be();

        // Run actual test
        await testDef.fn();

        // Run afterEach
        for (const ae of afterEaches) await ae();
      } catch (err: any) {
        status = 'failed';
        errorMsg = err?.message || String(err);
        expectedStr = err?.expected;
        actualStr = err?.actual;
        stackStr = err?.stack;
      }

      const duration = Math.max(1, Math.round(performance.now() - startTestTime));

      if (status === 'passed') filePassed++;
      else fileFailed++;

      suiteTestResults.push({
        id: testId,
        name: testDef.name,
        suiteName: suiteDef.name,
        status,
        duration,
        error: errorMsg,
        expected: expectedStr,
        actual: actualStr,
        stack: stackStr,
      });
    }

    const suiteDuration = Math.max(1, Math.round(performance.now() - startSuiteTime));
    const passedInSuite = suiteTestResults.filter(t => t.status === 'passed').length;
    const failedInSuite = suiteTestResults.filter(t => t.status === 'failed').length;

    suites.push({
      name: suiteDef.name,
      tests: suiteTestResults,
      duration: suiteDuration,
      passed: passedInSuite,
      failed: failedInSuite,
      skipped: 0,
    });
  }

  const totalFileDuration = Math.max(1, Math.round(performance.now() - startFileTime));

  // Construct CLI formatted output string
  const statusIcon = fileFailed > 0 ? 'FAIL' : 'PASS';
  let cliOutput = `${statusIcon}  ${testFile.name} (${totalFileDuration}ms)\n`;

  suites.forEach(s => {
    cliOutput += `  ${s.name}\n`;
    s.tests.forEach(t => {
      const mark = t.status === 'passed' ? '✓' : '✕';
      cliOutput += `    ${mark} ${t.name} (${t.duration}ms)\n`;
      if (t.error) {
        cliOutput += `      Error: ${t.error}\n`;
      }
    });
  });

  return {
    fileId: testFile.id,
    fileName: testFile.name,
    suites,
    duration: totalFileDuration,
    passed: filePassed,
    failed: fileFailed,
    skipped: fileSkipped,
    rawOutput: cliOutput,
  };
}

/**
 * Runs all discovered test files in the project
 */
export async function runAllTests(files: ProjectFile[]): Promise<TestRunSummary> {
  const startTime = performance.now();
  const testFiles = findTestFiles(files);
  const fileResults: TestFileResult[] = [];

  for (const testFile of testFiles) {
    const res = await executeTestFile(testFile, files);
    fileResults.push(res);
  }

  const duration = Math.max(1, Math.round(performance.now() - startTime));
  const totalFiles = fileResults.length;
  const passedFiles = fileResults.filter(f => f.failed === 0).length;
  const failedFiles = totalFiles - passedFiles;

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  fileResults.forEach(f => {
    totalTests += f.passed + f.failed + f.skipped;
    passedTests += f.passed;
    failedTests += f.failed;
    skippedTests += f.skipped;
  });

  return {
    fileResults,
    totalFiles,
    passedFiles,
    failedFiles,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    duration,
    timestamp: new Date().toLocaleTimeString(),
  };
}

/**
 * Template generator for new test files
 */
export function generateSampleTestCode(targetFileName?: string): string {
  const subject = targetFileName ? targetFileName.replace(/\.[^/.]+$/, '') : 'math';
  return `import { describe, it, expect, vi } from 'vitest';

describe('${subject.toUpperCase()} Test Suite', () => {
  it('performs basic arithmetic assertions', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
    expect(result).toBeGreaterThan(2);
  });

  it('validates string transforms and trim', () => {
    const title = '  Gemini Live IDE  ';
    expect(title.trim()).toBe('Gemini Live IDE');
    expect(title).toContain('IDE');
  });

  it('verifies array operations and length', () => {
    const items = ['html', 'css', 'typescript', 'sql'];
    expect(items).toHaveLength(4);
    expect(items).toContain('typescript');
  });

  it('supports deep object comparison', () => {
    const config = { mode: 'dark', hmr: false, retries: 3 };
    expect(config).toEqual({ mode: 'dark', hmr: false, retries: 3 });
  });

  it('handles async functions and promises', async () => {
    const asyncFetch = async () => 'data ready';
    const val = await asyncFetch();
    expect(val).toBe('data ready');
  });

  it('supports vi.fn mock execution', () => {
    const callback = vi.fn();
    callback('event_trigger', 42);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('event_trigger', 42);
  });
});
`;
}
