import { MobxStore, ParseMobx } from '../index';
import { configure } from 'mobx';

// Mock Parse SDK
const mockParseObject: any = {
  id: 'test123',
  className: 'TestObject',
  attributes: {
    title: 'Test Title',
    completed: false,
    createdAt: new Date('2024-01-01'),
  },
  isNew: jest.fn(() => false),
  get: jest.fn((key: string) => mockParseObject.attributes[key]),
  set: jest.fn((key: string, value: any) => {
    mockParseObject.attributes[key] = value;
    return mockParseObject;
  }),
  save: jest.fn(() => Promise.resolve(mockParseObject)),
  saveEventually: jest.fn(() => Promise.resolve(mockParseObject)),
  destroy: jest.fn(() => Promise.resolve(mockParseObject)),
  destroyEventually: jest.fn(() => Promise.resolve(mockParseObject)),
};

const mockQuery = {
  find: jest.fn(() => Promise.resolve([mockParseObject])),
  first: jest.fn(() => Promise.resolve(mockParseObject)),
  subscribe: jest.fn(() => Promise.resolve({
    on: jest.fn(),
    unsubscribe: jest.fn(),
  })),
};

// Mock Parse module
jest.mock('parse', () => ({
  Object: jest.fn().mockImplementation(() => mockParseObject),
  Query: jest.fn().mockImplementation(() => mockQuery),
  Error: jest.fn(),
}));

// Configure MobX for testing
configure({ enforceActions: 'never' });

describe('MobxStore', () => {
  let store: MobxStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new MobxStore('TestObject');
  });

  describe('Constructor', () => {
    test('should create MobxStore instance', () => {
      expect(store).toBeInstanceOf(MobxStore);
      expect(store.objects).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.subscriptionOpen).toBe(false);
    });
  });

  describe('fetchObjects', () => {
    test('should load objects from Parse and update state', async () => {
      expect(store.loading).toBe(false);
      
      // Trigger async operation
      store.fetchObjects();
      expect(store.loading).toBe(true);
      
      // Wait for async operation to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(store.loading).toBe(false);
      expect(store.objects.length).toBeGreaterThan(0);
      expect(mockQuery.find).toHaveBeenCalled();
    });

    test('should handle errors during fetch', async () => {
      const error = new Error('Fetch failed');
      mockQuery.find.mockRejectedValueOnce(error);
      
      store.fetchObjects();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(store.loading).toBe(false);
      expect(store.parseError).toBe(error);
    });

    test('should accept custom query', async () => {
      const customQuery = mockQuery;
      
      store.fetchObjects(customQuery as any);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(customQuery.find).toHaveBeenCalled();
    });
  });

  describe('createObject', () => {
    test('should create new object and update list', async () => {
      const params = { title: 'New Todo', completed: false };
      
      store.createObject(params, { updateList: true });
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(store.loading).toBe(false);
      expect(mockParseObject.save).toHaveBeenCalled();
    });

    test('should use saveEventually when specified', async () => {
      const params = { title: 'New Todo', completed: false };
      
      store.createObject(params, { saveEventually: true, updateList: true });
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockParseObject.saveEventually).toHaveBeenCalled();
    });

    test('should handle creation errors', async () => {
      const error = new Error('Creation failed');
      mockParseObject.save.mockRejectedValueOnce(error);
      
      const params = { title: 'New Todo', completed: false };
      store.createObject(params);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(store.loading).toBe(false);
      expect(store.parseError).toBe(error);
    });
  });

  describe('deleteObject', () => {
    test('should delete object and remove from list', async () => {
      const parseMobxObj = new ParseMobx(mockParseObject as any);
      
      // Add object to list first
      store.objects.push(parseMobxObj);
      expect(store.objects.length).toBe(1);
      
      store.deleteObject(parseMobxObj);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockParseObject.destroy).toHaveBeenCalled();
      expect(store.objects.length).toBe(0);
    });

    test('should use destroyEventually when specified', async () => {
      const parseMobxObj = new ParseMobx(mockParseObject as any);
      
      store.deleteObject(parseMobxObj, { deleteEventually: true });
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockParseObject.destroyEventually).toHaveBeenCalled();
    });

    test('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockParseObject.destroy.mockRejectedValueOnce(error);
      
      const parseMobxObj = new ParseMobx(mockParseObject as any);
      store.deleteObject(parseMobxObj);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(store.parseError).toBe(error);
    });
  });

  describe('Error Management', () => {
    test('clearError should clear parse error', () => {
      store.parseError = new Error('Test error') as any;
      expect(store.parseError).toBeDefined();
      
      store.clearError();
      
      expect(store.parseError).toBeUndefined();
    });
  });

  describe('LiveQuery Subscription', () => {
    test('should setup LiveQuery subscription', async () => {
      store.subscribe();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockQuery.subscribe).toHaveBeenCalled();
    });

    test('should not subscribe twice', async () => {
      const mockSubscription = { unsubscribe: jest.fn() };
      (store as any).subscription = mockSubscription;
      
      store.subscribe();
      
      // Should return early without calling subscribe
      expect(mockQuery.subscribe).not.toHaveBeenCalled();
    });

    test('should accept custom query for subscription', async () => {
      const customQuery = { ...mockQuery };
      
      store.subscribe(customQuery as any);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(customQuery.subscribe).toHaveBeenCalled();
    });

    test('unsubscribe should cleanup subscription', () => {
      const mockSubscription = { unsubscribe: jest.fn() };
      (store as any).subscription = mockSubscription;
      
      store.unsubscribe();
      
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect((store as any).subscription).toBeUndefined();
    });

    test('unsubscribe should handle no subscription gracefully', () => {
      expect(() => store.unsubscribe()).not.toThrow();
    });
  });

  describe('Event Callbacks', () => {
    test('onCreate should set create callback', () => {
      const createCallback = jest.fn();
      
      store.onCreate(createCallback);
      
      expect((store as any).createCallback).toBe(createCallback);
    });

    test('onUpdate should set update callback', () => {
      const updateCallback = jest.fn();
      
      store.onUpdate(updateCallback);
      
      expect((store as any).updateCallback).toBe(updateCallback);
    });

    test('onEnter should set enter callback', () => {
      const enterCallback = jest.fn();
      
      store.onEnter(enterCallback);
      
      expect((store as any).enterCallback).toBe(enterCallback);
    });

    test('onLeave should set leave callback', () => {
      const leaveCallback = jest.fn();
      
      store.onLeave(leaveCallback);
      
      expect((store as any).leaveCallback).toBe(leaveCallback);
    });

    test('onDelete should set delete callback', () => {
      const deleteCallback = jest.fn();
      
      store.onDelete(deleteCallback);
      
      expect((store as any).deleteCallback).toBe(deleteCallback);
    });

    test('default callbacks should return the object', () => {
      const parseMobxObj = new ParseMobx(mockParseObject as any);
      
      const createResult = (store as any).createCallback(parseMobxObj);
      const updateResult = (store as any).updateCallback(parseMobxObj);
      const enterResult = (store as any).enterCallback(parseMobxObj);
      const leaveResult = (store as any).leaveCallback(parseMobxObj);
      const deleteResult = (store as any).deleteCallback(parseMobxObj);
      
      expect(createResult).toBe(parseMobxObj);
      expect(updateResult).toBe(parseMobxObj);
      expect(enterResult).toBe(parseMobxObj);
      expect(leaveResult).toBe(parseMobxObj);
      expect(deleteResult).toBe(parseMobxObj);
    });
  });

  describe('Observable Properties', () => {
    test('objects should be observable array', () => {
      expect(Array.isArray(store.objects)).toBe(true);
      expect(store.objects.length).toBe(0);
    });

    test('loading should be observable boolean', () => {
      expect(typeof store.loading).toBe('boolean');
      expect(store.loading).toBe(false);
    });

    test('subscriptionOpen should be observable boolean', () => {
      expect(typeof store.subscriptionOpen).toBe('boolean');
      expect(store.subscriptionOpen).toBe(false);
    });

    test('parseError should be observable', () => {
      expect(store.parseError).toBeUndefined();
      
      const error = new Error('Test error');
      store.parseError = error as any;
      
      expect(store.parseError).toBe(error);
    });
  });
});
