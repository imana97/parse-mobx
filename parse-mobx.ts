// Import from mobx
import { action, configure, extendObservable, runInAction } from 'mobx';
import Parse from 'parse';

// Configure mobx strictMode. so any changes to observable must be in actions.
configure({ enforceActions: 'observed' });

/**
 * Main Class
 */
export class ParseMobx {
  private readonly attributes: any;
  private readonly parseObj: any;
  private readonly id: string;

  /**
   *
   * @param {ParseObject} obj The parse object.
   */
  constructor(obj: Parse.Object) {
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
    const observableObject: any = {};

    for (let key in obj.attributes) {
      const attribute = obj.attributes[key];

      if (attribute.constructor.name === 'ParseObjectSubclass') {
        this.attributes[key] = new ParseMobx(attribute);
      } else if (Array.isArray(attribute)) {
        observableObject[key] = attribute.map((el) =>
          el.constructor.name === 'ParseObjectSubclass'
            ? new ParseMobx(el)
            : el.constructor.name !== 'ParseRelation' &&
              el.constructor.name !== 'ParseACL'
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
   * @static
   * @param param
   * @returns {ParseMobx|<ParseMobx>|null}
   */
  static toParseMobx(param: Parse.Object | Parse.Object[] | Function): any {
    return typeof param === 'function'
      ? (obj: Parse.Object) => param(new ParseMobx(obj))
      : Array.isArray(param)
      ? param.map((obj: Parse.Object) => new ParseMobx(obj))
      : param
      ? new ParseMobx(param)
      : null;
  }

  /**
   *
   * @param list
   * @param item
   */
  static deleteListItemById(list: ParseMobx[], item: ParseMobx) {
    list.splice(
      list.findIndex((obj: ParseMobx) => obj.getId() === item.getId()),
      1,
    );
  }

  /**
   *
   * @param list
   * @param item
   */
  static updateListItem(list: ParseMobx[], item: ParseMobx) {
    list[list.findIndex((obj: ParseMobx) => obj.getId() === item.getId())] =
      item;
  }

  /**
   * Atomically add an object to the end of the array associated with a given key.
   * @param attr
   * @param item
   * @returns {ParseMobx}
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
   * @param attr
   * @param item
   * @returns {ParseMobx}
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
   * @param attr
   * @param items
   * @returns {ParseMobx}
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
   * @param key
   * @param value
   * @returns {ParseMobx}
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
   * Clear
   */
  clear() {
    return this.parseObj.clear();
  }

  /**
   * Clone
   */
  clone(): ParseMobx {
    return new ParseMobx(this.parseObj.clone());
  }

  /**
   *
   * @param options
   */
  destroy(options?: Parse.Object.DestroyOptions | undefined): Promise<this> {
    return this.parseObj.destroy(options);
  }

  /**
   *
   * @param options
   */
  destroyEventually(
    options?: Parse.Object.DestroyOptions | undefined,
  ): Promise<this> {
    return this.parseObj.destroyEventually(options);
  }

  /**
   *
   * @param attr
   * @returns {*|Boolean}
   */
  dirty(attr?: string | undefined): boolean {
    return this.parseObj.dirty(attr);
  }

  /**
   *
   * @returns {*|String[]}
   */
  dirtyKeys(): string[] {
    return this.parseObj.dirtyKeys();
  }

  /**
   *
   * @param other
   * @returns {*}
   */
  equals<T extends Parse.Object<Parse.Attributes>>(other: T): boolean {
    return this.parseObj.equals(other);
  }

  /**
   *
   * @param attr
   * @returns {*|string|void}
   */
  escape(attr: string): string {
    return this.parseObj.escape(attr);
  }

  /**
   *
   * @returns {*|Boolean}
   */
  existed(): boolean {
    return this.parseObj.existed();
  }

  /**
   *
   * @param options
   */
  exists(options?: Parse.RequestOptions | undefined): Promise<boolean> {
    return this.parseObj.exists(options);
  }

  /**
   *
   * @param options
   * @returns {Promise<ParseMobx>}
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
   */
  fetchFromLocalDatastore(): Promise<this> {
    return this.parseObj.fetchFromLocalDatastore();
  }

  /**
   *
   * @param keys
   * @param options
   * @returns {Promise<ParseMobx>}
   */
  fetchWithInclude<K extends string>(
    keys: K | (K | K[])[],
    options?: Parse.RequestOptions | undefined,
  ): Promise<this> {
    return new Promise((resolve, reject) => {
      this.parseObj
        .fetchWithInclude(keys, options)
        .then((newParseObj: Parse.Object) => new ParseMobx(newParseObj))
        .catch(reject);
    });
  }

  /**
   * return the attribute
   * @param key
   */
  get(key: string) {
    return this.attributes[key];
  }

  /**
   *
   */
  getId() {
    return this.id;
  }

  /**
   *
   * @returns {ParseMobx}
   */
  getACL(): Parse.ACL | undefined {
    return this.parseObj.getACL(arguments);
  }

  /**
   *
   * @param attr
   * @returns {*}
   */
  has(attr: string): boolean {
    return this.parseObj.has(attr);
  }

  /**
   *
   * @param attr
   * @param amount
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
   * @param attr
   * @param amount
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
   */
  isDataAvailable(): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   *
   */
  isNew(): boolean {
    return false;
  }

  /**
   *
   */
  isPinned(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  /**
   *
   * @returns {*|Boolean|boolean}
   */
  isValid(): boolean {
    return this.parseObj.isValid();
  }

  /**
   *
   * @returns {*|Parse.Object}
   */
  newInstance(): ParseMobx {
    return new ParseMobx(this.parseObj.newInstance());
  }

  /**
   *
   * @param attr
   * @returns {*|Parse.Op}
   */
  op(attr: string) {
    return this.parseObj.op(attr);
  }

  /**
   *
   */
  pin(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   *
   * @param name
   */
  pinWithName(name: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   *
   * @returns {*|Parse.Relation}
   */
  relation<R extends Parse.Object<Parse.Attributes>, K extends string = string>(
    attr: K,
  ): Parse.Relation<any, R> {
    return this.parseObj.relation(attr);
  }

  /**
   *
   * @param key
   * @param value
   * @returns {ParseMobx}
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
   * @param attr
   * @param items
   * @returns {ParseMobx}
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
   * @returns {ParseMobx}
   */
  @action
  revert(...keys: string[]): ParseMobx {
    this.parseObj.revert();
    return new ParseMobx(this.parseObj);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  @action
  save(options?: Parse.Object.SaveOptions) {
    return new Promise((resolve, reject) => {
      this.parseObj
        .save(options)
        .then(() => {
          runInAction(() =>
            this.set('updatedAt', new Date().toISOString(), undefined),
          );
          resolve(this);
        })
        .catch(reject);
    });
  }

  /**
   *
   * @param options
   */
  @action
  saveEventually(
    options?: Parse.Object.SaveOptions | undefined,
  ): Promise<this> {
    return new Promise((resolve, reject) => {
      this.parseObj
        .saveEventually(options)
        .then(() => {
          runInAction(() =>
            this.set('updatedAt', new Date().toISOString(), undefined),
          );
          resolve(this);
        })
        .catch(reject);
    });
  }

  /**
   *
   * @param key
   * @param value
   * @param options
   */
  @action
  set(key: string, value: any, options?: Parse.Object.SetOptions) {
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
   * @returns {ParseMobx}
   */
  setACL(
    acl: Parse.ACL,
    options?: Parse.SuccessFailureOptions | undefined,
  ): false | this {
    this.parseObj.setACL(acl, options);
    return this;
  }

  /**
   *
   * @returns {*}
   */
  toJSON(): Parse.Object.ToJSON<Parse.Attributes> & Parse.JSONBaseAttributes {
    return this.parseObj.toJSON();
  }

  /**
   *
   * @returns {ParseMobx}
   */
  toPointer(): Parse.Pointer {
    return this.parseObj.toPointer();
  }

  /**
   *
   */
  unPin(): Promise<void> {
    return this.parseObj.unPin();
  }

  /**
   *
   * @param name
   */
  unPinWithName(name: string): Promise<void> {
    return this.parseObj.unPinWithName(name);
  }

  /**
   *
   * @param attr
   * @param options
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
   * @param attrs
   * @returns {*|boolean|_ParseError.default|void|string|ActiveX.IXMLDOMParseError}
   */
  validate(
    attrs: Parse.Attributes,
    options?: Parse.SuccessFailureOptions | undefined,
  ): false | Parse.Error {
    return this.parseObj.validate(attrs, options);
  }

  /**
   *
   * @returns {ParseObject}
   */
  getParseObject(): Parse.Object {
    return this.parseObj;
  }

  /**
   *
   * @param key
   * @param value
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
   *
   * @param key
   * @param type
   * @private
   */
  private checkType(key: string, type: string): boolean {
    return this.attributes[key].constructor.name === type;
  }
}
