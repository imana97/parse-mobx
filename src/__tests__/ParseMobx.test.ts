import { ParseMobx } from '../index';
import { configure } from 'mobx';

// Mock Parse SDK
const mockParseObject: any = {
  id: 'test123',
  className: 'TestObject',
  attributes: {
    title: 'Test Title',
    completed: false,
    count: 5,
    tags: ['tag1', 'tag2'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  },
  isNew: jest.fn(() => false),
  get: jest.fn((key: string) => mockParseObject.attributes[key]),
  set: jest.fn((key: string, value: any) => {
    mockParseObject.attributes[key] = value;
    return mockParseObject;
  }),
  save: jest.fn(() => Promise.resolve(mockParseObject)),
  destroy: jest.fn(() => Promise.resolve(mockParseObject)),
  fetch: jest.fn(() => Promise.resolve(mockParseObject)),
  add: jest.fn(),
  addAll: jest.fn(),
  addAllUnique: jest.fn(),
  addUnique: jest.fn(),
  remove: jest.fn(),
  removeAll: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  revert: jest.fn(),
  unset: jest.fn(),
  has: jest.fn(() => true),
  dirty: jest.fn(() => false),
  dirtyKeys: jest.fn(() => []),
  equals: jest.fn(() => true),
  escape: jest.fn((attr: string) => mockParseObject.attributes[attr]),
  existed: jest.fn(() => true),
  exists: jest.fn(() => Promise.resolve(true)),
  isValid: jest.fn(() => true),
  isPinned: jest.fn(() => Promise.resolve(false)),
  pin: jest.fn(() => Promise.resolve()),
  unPin: jest.fn(() => Promise.resolve()),
  pinWithName: jest.fn(() => Promise.resolve()),
  unPinWithName: jest.fn(() => Promise.resolve()),
  relation: jest.fn(),
  getACL: jest.fn(),
  setACL: jest.fn(),
  toJSON: jest.fn(() => ({ ...mockParseObject.attributes, objectId: mockParseObject.id })),
  toPointer: jest.fn(() => ({ __type: 'Pointer', className: 'TestObject', objectId: mockParseObject.id })),
  clone: jest.fn(() => ({ ...mockParseObject })),
  clear: jest.fn(),
  validate: jest.fn(() => false),
  initialize: jest.fn(),
  newInstance: jest.fn(() => ({ ...mockParseObject })),
  op: jest.fn(),
  fetchFromLocalDatastore: jest.fn(() => Promise.resolve(mockParseObject)),
  fetchWithInclude: jest.fn(() => Promise.resolve(mockParseObject)),
  saveEventually: jest.fn(() => Promise.resolve(mockParseObject)),
  destroyEventually: jest.fn(() => Promise.resolve(mockParseObject)),
  isDataAvailable: jest.fn(() => true),
  _clearPendingOps: jest.fn(),
  _getId: jest.fn(() => 'test123'),
  _getStateIdentifier: jest.fn(() => 'state123'),
  toOfflinePointer: jest.fn(() => ({ __type: 'Pointer', className: 'TestObject', objectId: mockParseObject.id })),
};

// Configure MobX for testing
configure({ enforceActions: 'never' });

describe('ParseMobx', () => {
  let parseMobx: ParseMobx;

  beforeEach(() => {
    jest.clearAllMocks();
    parseMobx = new ParseMobx(mockParseObject as any);
  });

  describe('Constructor', () => {
    test('should create ParseMobx instance with saved Parse object', () => {
      expect(parseMobx).toBeInstanceOf(ParseMobx);
      expect(parseMobx.getId()).toBe('test123');
      expect(parseMobx.get('title')).toBe('Test Title');
    });

    test('should throw error for new Parse objects', () => {
      const newMockObject = { ...mockParseObject, isNew: jest.fn(() => true) };
      expect(() => new ParseMobx(newMockObject as any)).toThrow('Only Saved Parse objects can be converted to ParseMobx objects');
    });

    test('should make attributes observable', () => {
      expect(parseMobx.get('title')).toBe('Test Title');
      expect(parseMobx.get('completed')).toBe(false);
      expect(parseMobx.get('count')).toBe(5);
    });
  });

  describe('Static Methods', () => {
    test('toParseMobx should convert Parse object to ParseMobx', () => {
      const result = ParseMobx.toParseMobx(mockParseObject);
      expect(result).toBeInstanceOf(ParseMobx);
    });

    test('toParseMobx should convert array of Parse objects', () => {
      const result = ParseMobx.toParseMobx([mockParseObject, mockParseObject]);
      expect(Array.isArray(result)).toBe(true);
      expect((result as ParseMobx[])[0]).toBeInstanceOf(ParseMobx);
    });

    test('toParseMobx should handle null input', () => {
      const result = ParseMobx.toParseMobx(null);
      expect(result).toBeNull();
    });

    test('deleteListItemById should remove item from list', () => {
      const list = [parseMobx];
      const itemToDelete = parseMobx;
      ParseMobx.deleteListItemById(list, itemToDelete);
      expect(list.length).toBe(0);
    });
  });

  describe('Data Access Methods', () => {
    test('get should return attribute value', () => {
      expect(parseMobx.get('title')).toBe('Test Title');
      expect(parseMobx.get('count')).toBe(5);
    });

    test('getId should return object ID', () => {
      expect(parseMobx.getId()).toBe('test123');
    });

    test('has should check attribute existence', () => {
      expect(parseMobx.has('title')).toBe(true);
    });

    test('getParseObject should return underlying Parse object', () => {
      expect(parseMobx.getParseObject()).toBe(mockParseObject);
    });
  });

  describe('Data Modification Methods', () => {
    test('set should update attribute and call Parse set', () => {
      parseMobx.set('title', 'New Title');
      expect(mockParseObject.set).toHaveBeenCalledWith('title', 'New Title', undefined);
      expect(parseMobx.get('title')).toBe('New Title');
    });

    test('set should throw error for ParseRelation', () => {
      const relation = { constructor: { name: 'ParseRelation' } };
      expect(() => parseMobx.set('relation', relation)).toThrow('You can not add relations with set');
    });

    test('set should throw error for ParseACL', () => {
      const acl = { constructor: { name: 'ParseACL' } };
      expect(() => parseMobx.set('acl', acl)).toThrow('Please use setACL() instead');
    });

    test('unset should remove attribute', () => {
      parseMobx.unset('title');
      expect(mockParseObject.unset).toHaveBeenCalledWith('title', undefined);
    });

    test('increment should increase numeric value', () => {
      parseMobx.increment('count', 2);
      expect(mockParseObject.increment).toHaveBeenCalledWith('count', 2);
    });

    test('decrement should decrease numeric value', () => {
      parseMobx.decrement('count', 1);
      expect(mockParseObject.decrement).toHaveBeenCalledWith('count', 1);
    });
  });

  describe('Array Methods', () => {
    test('add should add item to array', () => {
      parseMobx.add('tags', 'tag3');
      expect(mockParseObject.add).toHaveBeenCalledWith('tags', 'tag3');
    });

    test('addAll should add multiple items to array', () => {
      const items = ['tag3', 'tag4'];
      parseMobx.addAll('tags', items);
      expect(mockParseObject.addAll).toHaveBeenCalledWith('tags', items);
    });

    test('addUnique should add unique item to array', () => {
      parseMobx.addUnique('tags', 'tag3');
      expect(mockParseObject.addUnique).toHaveBeenCalledWith('tags', 'tag3');
    });

    test('remove should remove item from array', () => {
      parseMobx.remove('tags', 'tag1');
      expect(mockParseObject.remove).toHaveBeenCalledWith('tags', 'tag1');
    });

    test('removeAll should remove multiple items from array', () => {
      const items = ['tag1', 'tag2'];
      parseMobx.removeAll('tags', items);
      expect(mockParseObject.removeAll).toHaveBeenCalledWith('tags', items);
    });
  });

  describe('Persistence Methods', () => {
    test('save should save object and update loading state', async () => {
      expect(parseMobx.loading).toBe(false);
      
      const savePromise = parseMobx.save();
      expect(parseMobx.loading).toBe(true);
      
      await savePromise;
      expect(mockParseObject.save).toHaveBeenCalled();
      expect(parseMobx.loading).toBe(false);
    });

    test('saveEventually should save object eventually', async () => {
      await parseMobx.saveEventually();
      expect(mockParseObject.saveEventually).toHaveBeenCalled();
    });

    test('destroy should delete object', async () => {
      await parseMobx.destroy();
      expect(mockParseObject.destroy).toHaveBeenCalled();
    });

    test('destroyEventually should delete object eventually', async () => {
      await parseMobx.destroyEventually();
      expect(mockParseObject.destroyEventually).toHaveBeenCalled();
    });

    test('fetch should fetch latest data', async () => {
      // Mock the fetch to return a promise that resolves
      mockParseObject.fetch.mockResolvedValueOnce(mockParseObject);
      
      const result = await parseMobx.fetch();
      expect(mockParseObject.fetch).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ParseMobx);
    }, 10000);

    test('fetchWithInclude should fetch with include', async () => {
      // Mock the fetchWithInclude to return a promise that resolves
      mockParseObject.fetchWithInclude.mockResolvedValueOnce(mockParseObject);
      
      const result = await parseMobx.fetchWithInclude('user');
      expect(mockParseObject.fetchWithInclude).toHaveBeenCalledWith('user', undefined);
      expect(result).toBeInstanceOf(ParseMobx);
    }, 10000);
  });

  describe('State Methods', () => {
    test('dirty should check if object has unsaved changes', () => {
      parseMobx.dirty();
      expect(mockParseObject.dirty).toHaveBeenCalled();
    });

    test('dirtyKeys should return array of dirty keys', () => {
      parseMobx.dirtyKeys();
      expect(mockParseObject.dirtyKeys).toHaveBeenCalled();
    });

    test('isNew should check if object is new', () => {
      parseMobx.isNew();
      expect(mockParseObject.isNew).toHaveBeenCalled();
    });

    test('isValid should check if object is valid', () => {
      parseMobx.isValid();
      expect(mockParseObject.isValid).toHaveBeenCalled();
    });

    test('existed should check if object existed on server', () => {
      parseMobx.existed();
      expect(mockParseObject.existed).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    test('clone should create a copy', () => {
      const cloned = parseMobx.clone();
      expect(cloned).toBeInstanceOf(ParseMobx);
      expect(mockParseObject.clone).toHaveBeenCalled();
    });

    test('toJSON should return JSON representation', () => {
      parseMobx.toJSON();
      expect(mockParseObject.toJSON).toHaveBeenCalled();
    });

    test('toPointer should return pointer representation', () => {
      parseMobx.toPointer();
      expect(mockParseObject.toPointer).toHaveBeenCalled();
    });

    test('toOfflinePointer should return offline pointer', () => {
      const result = parseMobx.toOfflinePointer();
      expect(result).toBeDefined();
    });

    test('equals should compare objects', () => {
      parseMobx.equals(mockParseObject as any);
      expect(mockParseObject.equals).toHaveBeenCalled();
    });
  });

  describe('Advanced Methods', () => {
    test('_clearPendingOps should clear pending operations', () => {
      expect(() => parseMobx._clearPendingOps()).not.toThrow();
      // Should not throw error even if method doesn't exist
    });

    test('_getId should return internal ID', () => {
      const result = parseMobx._getId();
      expect(typeof result).toBe('string');
    });

    test('_getStateIdentifier should return state identifier', () => {
      const result = parseMobx._getStateIdentifier();
      expect(result).toBeDefined();
    });

    test('isDataAvailable should check data availability', () => {
      const result = parseMobx.isDataAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Local Storage Methods', () => {
    test('pin should pin object locally', async () => {
      await parseMobx.pin();
      expect(mockParseObject.pin).toHaveBeenCalled();
    });

    test('unPin should unpin object', async () => {
      await parseMobx.unPin();
      expect(mockParseObject.unPin).toHaveBeenCalled();
    });

    test('pinWithName should pin with name', async () => {
      await parseMobx.pinWithName('test-pin');
      expect(mockParseObject.pinWithName).toHaveBeenCalledWith('test-pin');
    });

    test('isPinned should check pin status', async () => {
      await parseMobx.isPinned();
      expect(mockParseObject.isPinned).toHaveBeenCalled();
    });
  });
});
