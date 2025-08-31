import { jest } from '@jest/globals';

// Mock the parse packages
const mockParse = {
  version: 'regular-parse',
  Object: jest.fn(),
  Query: jest.fn(),
  Attributes: {},
};
const mockParseReactNative = {
  version: 'react-native-parse',
  Object: jest.fn(),
  Query: jest.fn(),
  Attributes: {},
};

jest.mock('parse', () => mockParse, { virtual: true });
jest.mock('parse/react-native', () => mockParseReactNative, { virtual: true });

describe('Entry Points', () => {
  let globalParseBackup: any;

  beforeEach(() => {
    // Clear any existing global Parse
    globalParseBackup = (global as any).Parse;
    delete (global as any).Parse;

    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original global Parse
    if (globalParseBackup) {
      (global as any).Parse = globalParseBackup;
    } else {
      delete (global as any).Parse;
    }
  });

  describe('Main Entry Point (parse-mobx)', () => {
    test('should export ParseMobx and MobxStore classes', async () => {
      // Import the main entry point
      const { ParseMobx, MobxStore } = await import('../index');

      // Verify classes are exported
      expect(ParseMobx).toBeDefined();
      expect(typeof ParseMobx).toBe('function');
      expect(MobxStore).toBeDefined();
      expect(typeof MobxStore).toBe('function');
    });

    test('should export configureParseMobx function', async () => {
      const { configureParseMobx } = await import('../index');

      expect(configureParseMobx).toBeDefined();
      expect(typeof configureParseMobx).toBe('function');
    });
  });

  describe('React Native Entry Point (parse-mobx/react-native)', () => {
    test('should export ParseMobx and MobxStore classes', async () => {
      // Import the react-native entry point
      const { ParseMobx, MobxStore } = await import('../react-native');

      // Verify classes are exported
      expect(ParseMobx).toBeDefined();
      expect(typeof ParseMobx).toBe('function');
      expect(MobxStore).toBeDefined();
      expect(typeof MobxStore).toBe('function');
    });

    test('should export configureParseMobx function', async () => {
      const { configureParseMobx } = await import('../react-native');

      expect(configureParseMobx).toBeDefined();
      expect(typeof configureParseMobx).toBe('function');
    });
  });

  describe('Configuration System', () => {
    test('configureParseMobx should be available from main entry point', async () => {
      const { configureParseMobx } = await import('../index');

      expect(configureParseMobx).toBeDefined();
      expect(typeof configureParseMobx).toBe('function');
    });

    test('configureParseMobx should be available from react-native entry point', async () => {
      const { configureParseMobx } = await import('../react-native');

      expect(configureParseMobx).toBeDefined();
      expect(typeof configureParseMobx).toBe('function');
    });

    test('configureParseMobx should accept valid Parse instance', async () => {
      const { configureParseMobx } = await import('../config');

      expect(() => {
        configureParseMobx(mockParse);
      }).not.toThrow();
    });

    test('configureParseMobx should reject invalid Parse instance', async () => {
      const { configureParseMobx } = await import('../config');

      expect(() => {
        configureParseMobx(null);
      }).toThrow('Parse instance is required');

      expect(() => {
        configureParseMobx({});
      }).toThrow('Invalid Parse instance: missing Object or Query constructor');
    });

    test('should work end-to-end with ParseMobx after configuration', async () => {
      const { configureParseMobx, getParseInstance } = await import('../config');
      const { ParseMobx } = await import('../index');

      // Configure with mock Parse
      configureParseMobx(mockParse);

      // Verify configuration worked
      expect(getParseInstance()).toBe(mockParse);

      // This should work now that Parse is configured
      // Note: We can't fully test instantiation without a complete mock,
      // but we can verify the configuration system works
      expect(typeof ParseMobx).toBe('function');
    });
  });

  describe('Class Availability', () => {
    test('ParseMobx should be available after main entry import', async () => {
      const { ParseMobx } = await import('../index');

      expect(ParseMobx).toBeDefined();
      expect(typeof ParseMobx).toBe('function');
    });

    test('MobxStore should be available after main entry import', async () => {
      const { MobxStore } = await import('../index');

      expect(MobxStore).toBeDefined();
      expect(typeof MobxStore).toBe('function');
    });

    test('ParseMobx should be available after react-native entry import', async () => {
      const { ParseMobx } = await import('../react-native');

      expect(ParseMobx).toBeDefined();
      expect(typeof ParseMobx).toBe('function');
    });

    test('MobxStore should be available after react-native entry import', async () => {
      const { MobxStore } = await import('../react-native');

      expect(MobxStore).toBeDefined();
      expect(typeof MobxStore).toBe('function');
    });
  });
});
