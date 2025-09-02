// Parse configuration module
let parseInstance: any = null;

/**
 * Configure the Parse instance to use with ParseMobx
 * @param parse - The Parse instance (from 'parse')
 */
export function configureParseMobx(parse: any): void {
  if (!parse) {
    throw new Error('Parse instance is required');
  }

  // Basic validation - check for essential Parse methods
  if (typeof parse.Object !== 'function' || typeof parse.Query !== 'function') {
    throw new Error('Invalid Parse instance: missing Object or Query constructor');
  }

  parseInstance = parse;

  // Make Parse available globally for backward compatibility
  // TODO: Remove this once all internal code is updated to use getParseInstance()
  if (typeof global !== 'undefined') {
    (global as any).Parse = parse;
  } else if (typeof window !== 'undefined') {
    (window as any).Parse = parse;
  }
}

/**
 * Get the configured Parse instance
 * @returns The configured Parse instance
 * @throws Error if Parse has not been configured
 */
export function getParseInstance(): any {
  if (!parseInstance) {
    throw new Error(
      'ParseMobx is not configured. Please call configureParseMobx(parse) first.\n' +
        'Example: import Parse from "parse"; configureParseMobx(Parse);',
    );
  }
  return parseInstance;
}

/**
 * Check if Parse has been configured
 * @returns true if Parse is configured, false otherwise
 */
export function isConfigured(): boolean {
  return parseInstance !== null;
}

/**
 * Reset the Parse configuration (mainly for testing)
 */
export function resetConfiguration(): void {
  parseInstance = null;
}
