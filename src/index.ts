import Parse from 'parse';
import { action, extendObservable, makeObservable, observable, runInAction } from 'mobx';
import { Attributes, CreateObjectOptions, DeleteObjectOptions, EventCallback } from './types';

/**
 * Parse Mobx Class
 */
export class ParseMobx {
  /**
   * Will set to true if the object is being saved.
   * @type {boolean}
   */
  @observable loading = false;

  /**
   * Contains the observable attributes.
   * @type {Parse.Attributes}
   * @private
   */
  @observable private readonly attributes: Parse.Attributes;

  /**
   * The parse Object
   * @type {Parse.Object}
   * @private
   */
  private readonly parseObj: Parse.Object;

  /**
   * Parse Object Id.
   * @type {string}
   * @private
   */
  private readonly id: string;

  /**
   * ParseMobx Class constructor
   * @param {Parse.Object} obj
   */
  constructor(obj: Parse.Object) {
    makeObservable(this);
    // make sure objects are saved.
    if (obj.isNew()) {
      throw new Error(`Only Saved Parse objects can be converted to ParseMobx objects.
            not saved object: ${obj.className}`);
    }

    // keep a ref of parse object.
    this.parseObj = obj;

    // copy id
    this.id = obj.id;
    this.attributes = { createdAt: obj.get('createdAt') };

    // store props to be observed.
    const observableObject: Parse.Attributes = {};

    for (const key in obj.attributes) {
      const attribute = obj.attributes[key];

      if (attribute.constructor.name === 'ParseObjectSubclass') {
        this.attributes[key] = new ParseMobx(attribute);
      } else if (Array.isArray(attribute)) {
        observableObject[key] = attribute.map((el) =>
          el.constructor.name === 'ParseObjectSubclass'
            ? new ParseMobx(el)
            : el.constructor.name !== 'ParseRelation' && el.constructor.name !== 'ParseACL'
            ? el
            : null,
        );
      } else if (
        attribute.constructor.name !== 'ParseRelation' &&
        attribute.constructor.name !== 'ParseACL' &&
        key !== 'createdAt'
      ) {
        observableObject[key] = attribute;
      }
    }

    extendObservable(this.attributes, observableObject);
  }

  /**
   * Convert a ParseObject or array of ParseObjects to ParseMobx object or array of ParseMobx objects.
   * @param param
   * @static
   * @returns {ParseMobx | ParseMobx[] | ((obj: Parse.Object) => any) | null}
   */
  static toParseMobx(param: any): ParseMobx | ParseMobx[] | ((obj: Parse.Object) => any) | null {
    return typeof param === 'function'
      ? (obj: Parse.Object) => param(new ParseMobx(obj))
      : Array.isArray(param)
      ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        param.map((obj: Parse.Object) => new ParseMobx(obj))
      : param
      ? new ParseMobx(param)
      : null;
  }

  /**
   * Delete an Item from a list of observable ParseMobx
   * @param {ParseMobx[]} list
   * @param {ParseMobx} item
   * @static
   */
  static deleteListItemById(list: ParseMobx[], item: ParseMobx): void {
    list.splice(
      list.findIndex((obj: ParseMobx) => obj.getId() === item.getId()),
      1,
    );
  }

  /**
   * Update an Item in the list of parse mobx observable list.
   * @param {ParseMobx[]} list
   * @param {ParseMobx} item
   * @deprecated
   * @static
   */
  static updateListItem(list: ParseMobx[], item: ParseMobx) {
    list[list.findIndex((obj: ParseMobx) => obj.getId() === item.getId())] = item;
  }

  /**
   * Atomically add an object to the end of the array associated with a given key.
   * @param {string} attr
   * @param {any} item
   * @returns {this}
   */
  @action
  add(attr: string, item: any): this {
    this.checkDefined(attr, []);
    this.parseObj.add(attr, item);
    this.attributes[attr].push(item);
    return this;
  }

  /**
   * Atomically add the objects to the end of the array associated with a given key.
   * @param {string} attr
   * @param {any[]} items
   * @returns {this}
   */
  @action
  addAll(attr: string, items: any[]): this {
    this.checkDefined(attr, []);
    this.parseObj.addAll(attr, items);
    this.attributes[attr] = this.attributes[attr].concat(items);
    return this;
  }

  /**
   * Atomically add the objects to the array associated with a given key,
   * only if it is not already present in the array. The position of the insert is not guaranteed.
   * @param {string} attr
   * @param {any[]} items
   * @returns {this}
   */
  @action
  addAllUnique(attr: string, items: any[]): this {
    this.checkDefined(attr, []);
    if (this.checkType(attr, 'Array')) {
      items.forEach((item) => {
        if (this.attributes[attr].indexOf(item) === -1) {
          item.constructor.name === 'ParseObjectSubclass'
            ? this.attributes[attr].push(new ParseMobx(item))
            : this.attributes[attr].push(item);
        }
      });
    }
    this.parseObj.addAllUnique(attr, items);
    return this;
  }

  /**
   * Atomically add an object to the array associated with a given key,
   * only if it is not already present in the array. The position of the insert is not guaranteed.
   * @param {string} key
   * @param value
   * @returns {this}
   */
  @action
  addUnique(key: string, value: any) {
    this.checkDefined(key, []);
    if (this.checkType(key, 'Array')) {
      if (this.attributes[key].indexOf(value) === -1) {
        value.constructor.name === 'ParseObjectSubclass'
          ? this.attributes[key].push(new ParseMobx(value))
          : this.attributes[key].push(value);
      }
    }
    this.parseObj.addUnique(key, value);
    return this;
  }

  /**
   * Clear Parse Object
   * @param options
   * @returns {any}
   */
  clear(options: any): any {
    return this.parseObj.clear(options);
  }

  /**
   *
   * @returns {ParseMobx}
   */
  clone(): ParseMobx {
    return new ParseMobx(this.parseObj.clone());
  }

  /**
   * Destroy Object on the server.
   * @param {Parse.Object.DestroyOptions | undefined} options
   * @returns {Promise<Parse.Object>}
   */
  destroy(options?: Parse.Object.DestroyOptions | undefined): Promise<Parse.Object> {
    return this.parseObj.destroy(options);
  }

  /**
   * Eventually Destroy an object on the server
   * @param {Parse.Object.DestroyOptions | undefined} options
   * @returns {Promise<Parse.Object>}
   */
  destroyEventually(options?: Parse.Object.DestroyOptions | undefined): Promise<Parse.Object> {
    return this.parseObj.destroyEventually(options);
  }

  /**
   *
   * @param {string | undefined} attr
   * @returns {boolean}
   */
  dirty(attr?: string | undefined): boolean {
    return this.parseObj.dirty(attr);
  }

  /**
   *
   * @returns {string[]}
   */
  dirtyKeys(): string[] {
    return this.parseObj.dirtyKeys();
  }

  /**
   *
   * @param {T} other
   * @returns {boolean}
   */
  equals<T extends Parse.Object<Parse.Attributes>>(other: T): boolean {
    return this.parseObj.equals(other);
  }

  /**
   *
   * @param {string} attr
   * @returns {string}
   */
  escape(attr: string): string {
    return this.parseObj.escape(attr);
  }

  /**
   *
   * @returns {boolean}
   */
  existed(): boolean {
    return this.parseObj.existed();
  }

  /**
   *
   * @param {Parse.RequestOptions | undefined} options
   * @returns {Promise<boolean>}
   */
  exists(options?: Parse.RequestOptions | undefined): Promise<boolean> {
    return this.parseObj.exists(options);
  }

  /**
   *
   * @param {Parse.Object.FetchOptions | undefined} options
   * @returns {Promise<this>}
   */
  fetch(options?: Parse.Object.FetchOptions | undefined): Promise<this> {
    return new Promise((resolve, reject) => {
      this.parseObj
        .fetch(options)
        .then((newParseObj: Parse.Object) => new ParseMobx(newParseObj))
        .catch(reject);
    });
  }

  /**
   *
   * @returns {Promise<Parse.Object>}
   */
  fetchFromLocalDatastore(): Promise<Parse.Object> {
    return this.parseObj.fetchFromLocalDatastore();
  }

  /**
   *
   * @param {(K[] | K)[] | K} keys
   * @param {Parse.RequestOptions | undefined} options
   * @returns {Promise<this>}
   */
  fetchWithInclude<K extends string>(keys: K | (K | K[])[], options?: Parse.RequestOptions | undefined): Promise<this> {
    return new Promise((resolve, reject) => {
      this.parseObj
        .fetchWithInclude(keys, options)
        .then((newParseObj: Parse.Object) => new ParseMobx(newParseObj))
        .catch(reject);
    });
  }

  /**
   *
   * @param {string} key
   * @returns {any}
   */
  get(key: string) {
    return this.attributes[key];
  }

  /**
   * Return the id of the parse object.
   * @returns {string}
   */
  getId() {
    return this.id;
  }

  /**
   *
   * @returns {Parse.ACL | undefined}
   */
  getACL(): Parse.ACL | undefined {
    return this.parseObj.getACL();
  }

  /**
   *
   * @param {string} attr
   * @returns {boolean}
   */
  has(attr: string): boolean {
    return this.parseObj.has(attr);
  }

  /**
   *
   * @param {string} attr
   * @param {number | undefined} amount
   * @returns {false | this}
   */
  @action
  increment(attr: string, amount?: number | undefined): false | this {
    // set 0 to attr if undefined.
    this.checkDefined(attr, 0);
    if (this.checkType(attr, 'Number')) {
      this.attributes[attr] += amount || 0;
    }
    this.parseObj.increment(attr, amount);
    return this;
  }

  /**
   *
   * @param {string} attr
   * @param {number | undefined} amount
   * @returns {false | this}
   */
  decrement(attr: string, amount?: number | undefined): false | this {
    this.checkDefined(attr, 0);
    if (this.checkType(attr, 'Number')) {
      this.attributes[attr] -= amount || 0;
    }
    this.parseObj.decrement(attr, amount);
    return this;
  }

  /**
   *
   */
  initialize(): void {
    return this.parseObj.initialize();
  }

  /**
   *
   * @returns {boolean}
   */
  isDataAvailable(): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   *
   * @returns {boolean}
   */
  isNew(): boolean {
    return this.parseObj.isNew();
  }

  /**
   *
   * @returns {Promise<boolean>}
   */
  isPinned(): Promise<boolean> {
    return this.parseObj.isPinned();
  }

  /**
   *
   * @returns {boolean}
   */
  isValid(): boolean {
    return this.parseObj.isValid();
  }

  /**
   *
   * @returns {ParseMobx}
   */
  newInstance(): ParseMobx {
    return new ParseMobx(this.parseObj.newInstance());
  }

  /**
   *
   * @param {string} attr
   * @returns {any}
   */
  op(attr: string): any {
    return this.parseObj.op(attr);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  pin(): Promise<void> {
    return this.parseObj.pin();
  }

  /**
   *
   * @param {string} name
   * @returns {Promise<void>}
   */
  pinWithName(name: string): Promise<void> {
    return this.parseObj.pinWithName(name);
  }

  /**
   *
   * @param {K} attr
   * @returns {Parse.Relation<any, R>}
   */
  relation<R extends Parse.Object<Parse.Attributes>, K extends string = string>(attr: K): Parse.Relation<any, R> {
    return this.parseObj.relation(attr);
  }

  /**
   *
   * @param {string} key
   * @param value
   * @returns {this}
   */
  @action
  remove(key: string, value: any) {
    this.checkDefined(key, []);

    if (this.checkType(key, 'Array')) {
      if (this.attributes[key].indexOf(value) !== -1) {
        this.attributes[key].splice(this.attributes[key].indexOf(value), 1);
      }
    }
    this.parseObj.remove(key, value);
    return this;
  }

  /**
   *
   * @param {string} attr
   * @param {any[]} items
   * @returns {this}
   */
  @action
  removeAll(attr: string, items: any[]) {
    this.checkDefined(attr, []);

    if (this.checkType(attr, 'Array')) {
      items.forEach((item) => {
        if (this.attributes[attr].indexOf(item) !== -1) {
          this.attributes[attr].splice(this.attributes[attr].indexOf(item), 1);
        }
      });
    }
    this.parseObj.removeAll(attr, items);
    return this;
  }

  /**
   *
   * @param {string} keys
   * @returns {ParseMobx}
   */
  @action
  revert(...keys: string[]): void {
    this.parseObj.revert(...keys);

    for (const key in keys) {
      this.attributes[key] = this.parseObj.get(key);
    }
  }

  /**
   *
   * @param {Parse.Object.SaveOptions} options
   * @returns {Promise<this>}
   */
  @action
  save(options?: Parse.Object.SaveOptions): Promise<this> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.parseObj
        .save(options)
        .then(() => {
          runInAction(() => {
            this.loading = false;
            this.set('updatedAt', new Date().toISOString(), undefined);
            resolve(this);
          });
        })
        .catch((error: any) => {
          runInAction(() => {
            this.loading = false;
            reject(error);
          });
        });
    });
  }

  /**
   *
   * @param {Parse.Object.SaveOptions | undefined} options
   * @returns {Promise<this>}
   */
  @action
  saveEventually(options?: Parse.Object.SaveOptions | undefined): Promise<this> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.parseObj
        .saveEventually(options)
        .then(() => {
          runInAction(() => {
            this.loading = false;
            this.set('updatedAt', new Date().toISOString(), undefined);
            resolve(this);
          });
        })
        .catch((error: any) => {
          runInAction(() => {
            this.loading = false;
            reject(error);
          });
        });
    });
  }

  /**
   *
   * @param {string} key
   * @param value
   * @param {Parse.Object.SetOptions} options
   * @returns {this}
   */
  @action
  set(key: string, value: any, options?: Parse.Object.SetOptions): this {
    if (value.constructor.name === 'ParseRelation') {
      throw new Error('You can not add relations with set');
    }
    if (value.constructor.name === 'ParseACL') {
      throw new Error('Please use setACL() instead');
    }
    if (typeof this.attributes[key] !== 'undefined') {
      // if it is parse subclass, create parse object.
      if (value.constructor.name === 'ParseObjectSubclass') {
        this.attributes[key] = new ParseMobx(value);
      } else {
        this.attributes[key] = value;
      }
    } else {
      const objToExtend: any = {};

      objToExtend[key] = value;
      extendObservable(this.attributes, objToExtend);
    }
    this.parseObj.set(key, value, options);
    return this;
  }

  /**
   *
   * @param {Parse.ACL} acl
   * @param {Parse.SuccessFailureOptions | undefined} options
   * @returns {false | this}
   */
  setACL(acl: Parse.ACL, options?: Parse.SuccessFailureOptions | undefined): false | this {
    this.parseObj.setACL(acl, options);
    return this;
  }

  /**
   *
   * @returns {Parse.Object.ToJSON<Parse.Attributes> & Parse.JSONBaseAttributes}
   */
  toJSON(): Parse.Object.ToJSON<Parse.Attributes> & Parse.JSONBaseAttributes {
    return this.parseObj.toJSON();
  }

  /**
   *
   * @returns {Parse.Pointer}
   */
  toPointer(): Parse.Pointer {
    return this.parseObj.toPointer();
  }

  /**
   *
   * @returns {Promise<void>}
   */
  unPin(): Promise<void> {
    return this.parseObj.unPin();
  }

  /**
   *
   * @param {string} name
   * @returns {Promise<void>}
   */
  unPinWithName(name: string): Promise<void> {
    return this.parseObj.unPinWithName(name);
  }

  /**
   *
   * @param {string} attr
   * @param options
   * @returns {this}
   */
  unset(attr: string, options?: any): this {
    this.parseObj.unset(attr, options);
    if (this.attributes[attr]) {
      delete this.attributes[attr];
    }
    return this;
  }

  /**
   *
   * @param {Parse.Attributes} attrs
   * @param {Parse.SuccessFailureOptions | undefined} options
   * @returns {false | Parse.Error}
   */
  validate(attrs: Parse.Attributes, options?: Parse.SuccessFailureOptions | undefined): false | Parse.Error {
    return this.parseObj.validate(attrs, options);
  }

  /**
   *
   * @returns {Parse.Object}
   */
  getParseObject(): Parse.Object {
    return this.parseObj;
  }

  /**
   * Check if a value is undefined and create the attribute for it with a default value/
   * @param {string} key
   * @param initValue
   * @private
   */
  private checkDefined(key: string, initValue: any): void {
    if (typeof this.attributes[key] === 'undefined') {
      const objToExtend: any = {};
      objToExtend[key] = initValue;
      extendObservable(this.attributes, objToExtend);
    }
  }

  /**
   * returns the type of attribute's value
   * @param {string} key
   * @param {string} type
   * @returns {boolean}
   * @private
   */
  private checkType(key: string, type: string): boolean {
    return this.attributes[key].constructor.name === type;
  }
}

/**
 * MobxStore Class
 */
export class MobxStore {
  /**
   * Contains the observable parseMobx objects
   * @type {ParseMobx[]}
   */
  @observable objects: ParseMobx[] = [];

  /**
   * Contains the parse error object
   * @type {Parse.Error}
   */
  @observable parseError?: Parse.Error;

  /**
   * Return the loading state of fetching objects, adding a new object or saving objects.
   * @type {boolean}
   */
  @observable loading = false;

  /**
   * If liveQuery subscription is open, the value will be false.
   * @type {boolean}
   */
  @observable subscriptionOpen = false;

  /**
   * The parse class name.
   * @type {string}
   * @private
   */
  private readonly parseClassName: string;

  /**
   * The subscription object.
   * @type {Parse.LiveQuerySubscription}
   * @private
   */
  private subscription?: Parse.LiveQuerySubscription;

  /**
   * Class constructor
   * @param {string} parseClassName
   */
  constructor(parseClassName: string) {
    this.parseClassName = parseClassName;
    makeObservable(this);
  }

  /**
   * Fetch Objects from parse server and update the Objects list
   * @param {Parse.Query} parseQuery
   */
  @action
  fetchObjects(parseQuery: Parse.Query = new Parse.Query(this.parseClassName)): void {
    (async () => {
      try {
        this.loading = true;
        const objects: Parse.Object[] = await parseQuery.find();
        runInAction(() => {
          this.loading = false;
          this.objects = ParseMobx.toParseMobx(objects) as any;
        });
      } catch (error: any) {
        this.loading = false;
        this.parseError = error;
      }
    })();
  }

  /**
   * Create and save an object to the list of observable objects.
   * @param {Attributes} params
   * @param {CreateObjectOptions} options
   */
  @action
  createObject(params: Attributes, options?: CreateObjectOptions): void {
    (async () => {
      this.loading = true;
      try {
        const newObject: Parse.Object = new Parse.Object(this.parseClassName);
        for (const key in params) {
          newObject.set(key, params[key]);
        }
        options?.saveEventually ? await newObject.saveEventually() : await newObject.save();

        runInAction(() => {
          this.loading = false;
          if (options?.updateList) {
            this.objects.push(ParseMobx.toParseMobx(newObject) as any);
          }
        });
      } catch (error: any) {
        this.loading = false;
        this.parseError = error;
      }
    })();
  }

  /**
   * Clear error observable
   */
  @action
  clearError(): void {
    this.parseError = undefined;
  }

  /**
   * Delete an object on the server and update hte objects list.
   * @param {ParseMobx} obj
   * @param {DeleteObjectOptions} options
   */
  @action
  deleteObject(obj: ParseMobx, options?: DeleteObjectOptions): void {
    (async () => {
      try {
        this.loading = true;
        obj.getParseObject();
        options?.deleteEventually ? await obj.destroyEventually() : await obj.destroy();
        runInAction(() => {
          this.loading = false;
          ParseMobx.deleteListItemById(this.objects, obj);
        });
      } catch (error: any) {
        this.parseError = error;
      }
    })();
  }

  /**
   * Subscribe to liveQuery
   * @param {Parse.Query} parseQuery
   */
  @action
  subscribe(parseQuery: Parse.Query = new Parse.Query(this.parseClassName)): void {
    (async () => {
      if (this.subscription) return false; // don't listen twice
      this.subscription = await parseQuery.subscribe();
      this.subscription.on('open', () => {
        runInAction(() => {
          this.subscriptionOpen = true;
        });
      });

      this.subscription.on('create', (object: Parse.Object) => this.createCallback(new ParseMobx(object)));
      this.subscription.on('update', (object: Parse.Object) => this.updateCallback(new ParseMobx(object)));
      this.subscription.on('enter', (object: Parse.Object) => this.enterCallback(new ParseMobx(object)));
      this.subscription.on('leave', (object: Parse.Object) => this.leaveCallback(new ParseMobx(object)));
      this.subscription.on('delete', (object: Parse.Object) => this.deleteCallback(new ParseMobx(object)));
      this.subscription.on('close', () => {
        runInAction(() => {
          this.subscriptionOpen = false;
        });
      });
    })();
  }

  /**
   * Register a callback for onCreate
   * @param {EventCallback} callback
   */
  onCreate(callback: EventCallback): void {
    this.createCallback = callback;
  }

  /**
   * Register a callback for onUpdate
   * @param {EventCallback} callback
   */
  onUpdate(callback: EventCallback): void {
    this.updateCallback = callback;
  }

  /**
   * Register a callback for onEnter
   * @param {EventCallback} callback
   */
  onEnter(callback: EventCallback): void {
    this.enterCallback = callback;
  }

  /**
   * Register a callback for onLeave
   * @param {EventCallback} callback
   */
  onLeave(callback: EventCallback): void {
    this.leaveCallback = callback;
  }

  /**
   * Register a callback for onDelete
   * @param {EventCallback} callback
   */
  onDelete(callback: EventCallback): void {
    this.deleteCallback = callback;
  }

  /**
   * Unsubscribe from LiveQuery
   */
  unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }

  /**
   *
   * @param {ParseMobx} object
   * @private
   * @returns {ParseMobx}
   */
  private createCallback: EventCallback = (object: ParseMobx) => {
    return object;
  };

  /**
   *
   * @param {ParseMobx} object
   * @private
   * @returns {ParseMobx}
   */
  private updateCallback: EventCallback = (object: ParseMobx) => {
    return object;
  };

  /**
   *
   * @param {ParseMobx} object
   * @private
   * @returns {ParseMobx}
   */
  private enterCallback: EventCallback = (object: ParseMobx) => {
    return object;
  };

  /**
   *
   * @param {ParseMobx} object
   * @private
   * @returns {ParseMobx}
   */
  private leaveCallback: EventCallback = (object: ParseMobx) => {
    return object;
  };

  /**
   *
   * @param {ParseMobx} object
   * @private
   * @returns {ParseMobx}
   */
  private deleteCallback: EventCallback = (object: ParseMobx) => {
    return object;
  };
}
