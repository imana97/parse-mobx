import { EventCallback, Attributes, CreateObjectOptions, DeleteObjectOptions } from '../types';
import { ParseMobx } from '../index';

describe('Type Definitions', () => {
  describe('EventCallback', () => {
    test('should accept ParseMobx object and return any', () => {
      const mockParseObject = {
        id: 'test',
        isNew: () => false,
        attributes: { title: 'test' },
        get: jest.fn(),
        set: jest.fn().mockReturnThis(),
        save: jest.fn(),
        destroy: jest.fn(),
      };

      const parseMobx = new ParseMobx(mockParseObject as any);

      const callback: EventCallback = (obj: ParseMobx) => {
        expect(obj).toBeInstanceOf(ParseMobx);
        return obj;
      };

      const result = callback(parseMobx);
      expect(result).toBe(parseMobx);
    });
  });

  describe('Attributes', () => {
    test('should accept key-value pairs of any type', () => {
      const attributes: Attributes = {
        title: 'string value',
        count: 42,
        active: true,
        tags: ['tag1', 'tag2'],
        metadata: { key: 'value' },
        date: new Date(),
      };

      expect(attributes.title).toBe('string value');
      expect(attributes.count).toBe(42);
      expect(attributes.active).toBe(true);
      expect(Array.isArray(attributes.tags)).toBe(true);
      expect(typeof attributes.metadata).toBe('object');
      expect(attributes.date).toBeInstanceOf(Date);
    });
  });

  describe('CreateObjectOptions', () => {
    test('should accept optional updateList and saveEventually properties', () => {
      const options1: CreateObjectOptions = {};
      const options2: CreateObjectOptions = { updateList: true };
      const options3: CreateObjectOptions = { saveEventually: true };
      const options4: CreateObjectOptions = { updateList: false, saveEventually: true };

      expect(options1.updateList).toBeUndefined();
      expect(options1.saveEventually).toBeUndefined();

      expect(options2.updateList).toBe(true);
      expect(options2.saveEventually).toBeUndefined();

      expect(options3.updateList).toBeUndefined();
      expect(options3.saveEventually).toBe(true);

      expect(options4.updateList).toBe(false);
      expect(options4.saveEventually).toBe(true);
    });
  });

  describe('DeleteObjectOptions', () => {
    test('should accept optional deleteEventually property', () => {
      const options1: DeleteObjectOptions = {};
      const options2: DeleteObjectOptions = { deleteEventually: true };
      const options3: DeleteObjectOptions = { deleteEventually: false };

      expect(options1.deleteEventually).toBeUndefined();
      expect(options2.deleteEventually).toBe(true);
      expect(options3.deleteEventually).toBe(false);
    });
  });
});
