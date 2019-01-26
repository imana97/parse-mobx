// Import from mobx
import {action, configure, extendObservable, runInAction} from "mobx";

// Configure mobx strictMode. so any changes to observable must be in actions.
configure({enforceActions: "observed"});

/**
 * Main Class
 */
export class ParseMobx {
    /**
     *
     * @param {ParseObject} obj The parse object.
     */
    constructor(obj) {
        // make sure objects are saved.
        if (obj.isNew()) {
            throw new Error(`Only Saved Parse objects can be converted to ParseMobx objects.
            not saved object: ${obj.className}`);
        }

        // keep a ref of parse object.
        this._parseObj = obj;

        // copy id
        this.id = obj.id;
        this.attributes = {createdAt: obj.get("createdAt")};
        // store props to be observed.

        const observableObject = {};

        for (let key in obj.attributes) {
            const attribute = obj.attributes[key];

            if (attribute.constructor.name === "ParseObjectSubclass") {
                this.attributes[key] = new ParseMobx(attribute);
            } else if (attribute.constructor.name === "ParseObjectSubclass") {
                observableObject[key] = attribute.map(el =>
                    el.constructor.name === "ParseObjectSubclass" ? ParseMobx(el) : el
                );
            } else if (
                attribute.constructor.name !== "ParseRelation" &&
                attribute.constructor.name !== "ParseACL" &&
                key !== "createdAt"
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
    static toParseMobx(param) {
        return typeof param === "function"
            ? obj => param(new ParseMobx(obj))
            : Array.isArray(param)
                ? param.map(obj => new ParseMobx(obj))
                : param
                    ? new ParseMobx(param)
                    : null;
    }

    /**
     *
     * @param list
     * @param item
     * @param key
     */
    static deleteListItem(list, item, key = "id") {
        list.splice(list.findIndex(obj => obj[key] === item[key]), 1);
    }

    /**
     *
     * @param list
     * @param item
     * @param key
     */
    static updateListItem(list, item, key = "id") {
        list[list.findIndex(obj => obj[key] === item[key])] = item;
    }

    /**
     *
     * @param key
     * @param value
     * @private
     */
    _checkDefined(key, initValue) {
        if (typeof this.attributes[key] === "undefined") {
            const objToExtend = {};
            objToExtend[key] = initValue;
            extendObservable(this.attributes, objToExtend);
        }
    }

    _checkType(key, type) {
        return this.attributes[key].constructor.name === type;
    }

    /**
     * todo: update Model
     * Atomically add an object to the end of the array associated with a given key.
     * @param attr
     * @param item
     * @returns {ParseMobx}
     */
    add(attr, item) {
        this._parseObj.add(attr, item);
        return this;
    }

    /**
     * todo: update Model
     * Atomically add the objects to the end of the array associated with a given key.
     * @param attr
     * @param item
     * @returns {ParseMobx}
     */
    addAll(attr, item) {
        this._parseObj.addAll(attr, item);
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
    addAllUnique(attr, items) {
        this._checkDefined(attr,[]);
        if (this._checkType(attr, "Array")) {
            items.forEach(item=>{
                if (this.attributes[attr].indexOf(item) === -1) {
                    (item.constructor.name ==="ParseObjectSubclass")
                        ? this.attributes[attr].push(new ParseMobx(item))
                        : this.attributes[attr].push(item);
                }
            });
        }
        this._parseObj.addAllUnique(attr, items);
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
    addUnique(key, value) {
        this._checkDefined(key, []);
        if (this._checkType(key, "Array")) {
            if (this.attributes[key].indexOf(value) === -1) {
                (value.constructor.name ==="ParseObjectSubclass")
                    ? this.attributes[key].push(new ParseMobx(value))
                    : this.attributes[key].push(value);
            }
        }
        this._parseObj.addUnique(key, value);
        return this;
    }

    /**
     *
     */
    clear() {
        return this._parseObj.clear();
    }

    /**
     *
     */
    clone() {
        return this._parseObj.clone();
    }

    /**
     *
     * @returns {Promise<*>}
     */
    async destroy(options) {
        return this._parseObj.destroy(options);
    }

    /**
     *
     * @param attr
     * @returns {*|Boolean}
     */
    dirty(attr) {
        return this._parseObj.dirty(attr);
    }

    /**
     *
     * @returns {*|String[]}
     */
    dirtyKeys() {
        return this._parseObj.dirtyKeys();
    }

    /**
     *
     * @param other
     * @returns {*}
     */
    equals(other) {
        return this._parseObj.equals(other);
    }

    /**
     *
     * @param attr
     * @returns {*|string|void}
     */
    escape(attr) {
        return this._parseObj.escape(attr);
    }

    /**
     *
     * @returns {*|Boolean}
     */
    existed() {
        return this._parseObj.existed();
    }

    /**
     *
     * @param options
     * @returns {Promise<ParseMobx>}
     */
    async fetch(options) {
        const newParseObj = await this._parseObj.fetch(options);
        return new ParseMobx(newParseObj);
    }

    /**
     *
     * @param keys
     * @param options
     * @returns {Promise<ParseMobx>}
     */
    async fetchWithInclude(keys, options) {
        const newParseObj = await this._parseObj.fetchWithInclude(keys, options);
        return new ParseMobx(newParseObj);
    }

    /**
     *
     * @param key
     * @returns {*}
     */
    get(key) {
        return this.attributes[key];
    }

    /**
     *
     * @returns {ParseMobx}
     */
    getACL() {
        this._parseObj.getACL(arguments);
        return this;
    }

    /**
     *
     * @param attr
     * @returns {*}
     */
    has(attr) {
        return this._parseObj.has(attr);
    }

    /**
     *
     * @param attr
     * @param amount
     */
    @action
    increment(attr, amount = 1) {
        // set 0 to attr if undefined.
        this._checkDefined(attr, 0);

        if (this._checkType(attr, "Number")) {
            this.attributes[attr] += amount;
        }
        this._parseObj.increment(attr, amount);
    }

    /**
     *
     * @returns {boolean}
     */
    isNew() {
        return false;
    }

    /**
     *
     * @returns {*|Boolean|boolean}
     */
    isValid() {
        return this._parseObj.isValid();
    }

    /**
     *
     * @returns {*|Parse.Object}
     */
    newInstance() {
        return this._parseObj.newInstance();
    }

    /**
     *
     * @param attr
     * @returns {*|Parse.Op}
     */
    op(attr) {
        return this._parseObj.op(attr);
    }

    /**
     *
     * @returns {*|Parse.Relation}
     */
    relation(attr) {
        return this._parseObj.relation(attr);
    }

    /**
     *
     * @param key
     * @param value
     * @returns {ParseMobx}
     */
    @action
    remove(key, value) {
        this._checkDefined(key, []);

        if (this._checkType(key, "Array")) {
            if (this.attributes[key].indexOf(value) !== -1) {
                this.attributes[key].splice(this.attributes[key].indexOf(value), 1);
            }
        }
        this._parseObj.remove(key, value);
        return this;
    }

    /**
     *
     * @param attr
     * @param items
     * @returns {ParseMobx}
     */
    @action
    removeAll(attr, items) {
        this._checkDefined(attr, []);
        if (this._checkType(attr, "Array") && this._checkType(items, "Array")) {
            items.forEach(item => {
                if (this.attributes[attr].indexOf(item) !== -1) {
                    this.attributes[attr].splice(this.attributes[attr].indexOf(item), 1);
                }
            });
        }
        this._parseObj.removeAll(attr, items);
        return this;
    }

    /**
     *
     * @returns {ParseMobx}
     */
    @action
    revert() {
        this._parseObj.revert();
        return new ParseMobx(this._parseObj);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    @action
    async save(options) {
        await this._parseObj.save(options);
        runInAction(() => this.set("updatedAt", new Date().toISOString()));
    }

    /**
     *
     * @param key
     * @param value
     * @returns {ParseMobx}
     */
    @action
    set(key, value, options) {
        if (value.constructor.name === "ParseRelation") {
            throw new Error("You can not add relations with set");
        }
        if (value.constructor.name === "ParseACL") {
            throw new Error("Please use setACL() instead");
        }
        if (typeof this.attributes[key] !== "undefined") {
            // if it is parse subclass, create parse object.
            if (value.constructor.name === "ParseObjectSubclass") {
                this.attributes[key] = new ParseMobx(value);
            } else {
                this.attributes[key] = value;
            }
        } else {
            const objToExtend = {};
            objToExtend[key] = value;
            extendObservable(this.attributes, objToExtend);
        }
        this._parseObj.set(key, value, options);
        return this;
    }

    /**
     *
     * @returns {ParseMobx}
     */
    setACL(acl, options) {
        this._parseObj.setACL(acl, options);
        return this;
    }

    /**
     *
     * @returns {*}
     */
    toJSON() {
        return this._parseObj.toJSON();
    }

    /**
     *
     * @returns {ParseMobx}
     */
    toPointer() {
        return this;
    }

    /**
     * todo: update model?
     * @param attr
     */
    unset(attr) {
        this._parseObj.unset(attr);
        return new ParseMobx(this._parseObj);
    }

    /**
     *
     * @param attrs
     * @returns {*|boolean|_ParseError.default|void|string|ActiveX.IXMLDOMParseError}
     */
    validate(attrs) {
        return this._parseObj.validate(attrs);
    }

    /**
     *
     * @returns {ParseObject}
     */
    getParseObject() {
        return this._parseObj;
    }
}
