import { ParseMobx, MobxStore } from '../index';

describe('Library Exports', () => {
  test('should export ParseMobx class', () => {
    expect(ParseMobx).toBeDefined();
    expect(typeof ParseMobx).toBe('function');
  });

  test('should export MobxStore class', () => {
    expect(MobxStore).toBeDefined();
    expect(typeof MobxStore).toBe('function');
  });
});
