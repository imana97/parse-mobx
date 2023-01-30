"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseMobx = void 0;
// Import from mobx
var mobx_1 = require("mobx");
// Configure mobx strictMode. so any changes to observable must be in actions.
(0, mobx_1.configure)({ enforceActions: 'observed' });
/**
 * Main Class
 */
var ParseMobx = /** @class */ (function () {
    /**
     *
     * @param {ParseObject} obj The parse object.
     */
    function ParseMobx(obj) {
        // make sure objects are saved.
        if (obj.isNew()) {
            throw new Error("Only Saved Parse objects can be converted to ParseMobx objects.\n            not saved object: ".concat(obj.className));
        }
        // keep a ref of parse object.
        this.parseObj = obj;
        // copy id
        this.id = obj.id;
        this.attributes = { createdAt: obj.get('createdAt') };
        // store props to be observed.
        var observableObject = {};
        for (var key in obj.attributes) {
            var attribute = obj.attributes[key];
            if (attribute.constructor.name === 'ParseObjectSubclass') {
                this.attributes[key] = new ParseMobx(attribute);
            }
            else if (Array.isArray(attribute)) {
                observableObject[key] = attribute.map(function (el) {
                    return el.constructor.name === 'ParseObjectSubclass'
                        ? new ParseMobx(el)
                        : el.constructor.name !== 'ParseRelation' &&
                            el.constructor.name !== 'ParseACL'
                            ? el
                            : null;
                });
            }
            else if (attribute.constructor.name !== 'ParseRelation' &&
                attribute.constructor.name !== 'ParseACL' &&
                key !== 'createdAt') {
                observableObject[key] = attribute;
            }
        }
        (0, mobx_1.extendObservable)(this.attributes, observableObject);
    }
    /**
     * Convert a ParseObject or array of ParseObjects to ParseMobx object or array of ParseMobx objects.
     * @static
     * @param param
     * @returns {ParseMobx|<ParseMobx>|null}
     */
    ParseMobx.toParseMobx = function (param) {
        return typeof param === 'function'
            ? function (obj) { return param(new ParseMobx(obj)); }
            : Array.isArray(param)
                ? param.map(function (obj) { return new ParseMobx(obj); })
                : param
                    ? new ParseMobx(param)
                    : null;
    };
    /**
     *
     * @param list
     * @param item
     */
    ParseMobx.deleteListItemById = function (list, item) {
        list.splice(list.findIndex(function (obj) { return obj.getId() === item.getId(); }), 1);
    };
    /**
     *
     * @param list
     * @param item
     */
    ParseMobx.updateListItem = function (list, item) {
        list[list.findIndex(function (obj) { return obj.getId() === item.getId(); })] =
            item;
    };
    /**
     * Atomically add an object to the end of the array associated with a given key.
     * @param attr
     * @param item
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.add = function (attr, item) {
        this.checkDefined(attr, []);
        this.parseObj.add(attr, item);
        this.attributes[attr].push(item);
        return this;
    };
    /**
     * Atomically add the objects to the end of the array associated with a given key.
     * @param attr
     * @param item
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.addAll = function (attr, items) {
        this.checkDefined(attr, []);
        this.parseObj.addAll(attr, items);
        this.attributes[attr] = this.attributes[attr].concat(items);
        return this;
    };
    /**
     * Atomically add the objects to the array associated with a given key,
     * only if it is not already present in the array. The position of the insert is not guaranteed.
     * @param attr
     * @param items
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.addAllUnique = function (attr, items) {
        var _this = this;
        this.checkDefined(attr, []);
        if (this.checkType(attr, 'Array')) {
            items.forEach(function (item) {
                if (_this.attributes[attr].indexOf(item) === -1) {
                    item.constructor.name === 'ParseObjectSubclass'
                        ? _this.attributes[attr].push(new ParseMobx(item))
                        : _this.attributes[attr].push(item);
                }
            });
        }
        this.parseObj.addAllUnique(attr, items);
        return this;
    };
    /**
     * Atomically add an object to the array associated with a given key,
     * only if it is not already present in the array. The position of the insert is not guaranteed.
     * @param key
     * @param value
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.addUnique = function (key, value) {
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
    };
    /**
     * Clear
     */
    ParseMobx.prototype.clear = function () {
        return this.parseObj.clear();
    };
    /**
     * Clone
     */
    ParseMobx.prototype.clone = function () {
        return new ParseMobx(this.parseObj.clone());
    };
    /**
     *
     * @param options
     */
    ParseMobx.prototype.destroy = function (options) {
        return this.parseObj.destroy(options);
    };
    /**
     *
     * @param options
     */
    ParseMobx.prototype.destroyEventually = function (options) {
        return this.parseObj.destroyEventually(options);
    };
    /**
     *
     * @param attr
     * @returns {*|Boolean}
     */
    ParseMobx.prototype.dirty = function (attr) {
        return this.parseObj.dirty(attr);
    };
    /**
     *
     * @returns {*|String[]}
     */
    ParseMobx.prototype.dirtyKeys = function () {
        return this.parseObj.dirtyKeys();
    };
    /**
     *
     * @param other
     * @returns {*}
     */
    ParseMobx.prototype.equals = function (other) {
        return this.parseObj.equals(other);
    };
    /**
     *
     * @param attr
     * @returns {*|string|void}
     */
    ParseMobx.prototype.escape = function (attr) {
        return this.parseObj.escape(attr);
    };
    /**
     *
     * @returns {*|Boolean}
     */
    ParseMobx.prototype.existed = function () {
        return this.parseObj.existed();
    };
    /**
     *
     * @param options
     */
    ParseMobx.prototype.exists = function (options) {
        return this.parseObj.exists(options);
    };
    /**
     *
     * @param options
     * @returns {Promise<ParseMobx>}
     */
    ParseMobx.prototype.fetch = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.parseObj
                .fetch(options)
                .then(function (newParseObj) { return new ParseMobx(newParseObj); })
                .catch(reject);
        });
    };
    /**
     *
     */
    ParseMobx.prototype.fetchFromLocalDatastore = function () {
        return this.parseObj.fetchFromLocalDatastore();
    };
    /**
     *
     * @param keys
     * @param options
     * @returns {Promise<ParseMobx>}
     */
    ParseMobx.prototype.fetchWithInclude = function (keys, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.parseObj
                .fetchWithInclude(keys, options)
                .then(function (newParseObj) { return new ParseMobx(newParseObj); })
                .catch(reject);
        });
    };
    /**
     * return the attribute
     * @param key
     */
    ParseMobx.prototype.get = function (key) {
        return this.attributes[key];
    };
    /**
     *
     */
    ParseMobx.prototype.getId = function () {
        return this.id;
    };
    /**
     *
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.getACL = function () {
        return this.parseObj.getACL(arguments);
    };
    /**
     *
     * @param attr
     * @returns {*}
     */
    ParseMobx.prototype.has = function (attr) {
        return this.parseObj.has(attr);
    };
    /**
     *
     * @param attr
     * @param amount
     */
    ParseMobx.prototype.increment = function (attr, amount) {
        // set 0 to attr if undefined.
        this.checkDefined(attr, 0);
        if (this.checkType(attr, 'Number')) {
            this.attributes[attr] += amount || 0;
        }
        this.parseObj.increment(attr, amount);
        return this;
    };
    /**
     *
     * @param attr
     * @param amount
     */
    ParseMobx.prototype.decrement = function (attr, amount) {
        this.checkDefined(attr, 0);
        if (this.checkType(attr, 'Number')) {
            this.attributes[attr] -= amount || 0;
        }
        this.parseObj.decrement(attr, amount);
        return this;
    };
    /**
     *
     */
    ParseMobx.prototype.initialize = function () {
        return this.parseObj.initialize();
    };
    /**
     *
     */
    ParseMobx.prototype.isDataAvailable = function () {
        throw new Error('Method not implemented.');
    };
    /**
     *
     */
    ParseMobx.prototype.isNew = function () {
        return false;
    };
    /**
     *
     */
    ParseMobx.prototype.isPinned = function () {
        throw new Error('Method not implemented.');
    };
    /**
     *
     * @returns {*|Boolean|boolean}
     */
    ParseMobx.prototype.isValid = function () {
        return this.parseObj.isValid();
    };
    /**
     *
     * @returns {*|Parse.Object}
     */
    ParseMobx.prototype.newInstance = function () {
        return new ParseMobx(this.parseObj.newInstance());
    };
    /**
     *
     * @param attr
     * @returns {*|Parse.Op}
     */
    ParseMobx.prototype.op = function (attr) {
        return this.parseObj.op(attr);
    };
    /**
     *
     */
    ParseMobx.prototype.pin = function () {
        throw new Error('Method not implemented.');
    };
    /**
     *
     * @param name
     */
    ParseMobx.prototype.pinWithName = function (name) {
        throw new Error('Method not implemented.');
    };
    /**
     *
     * @returns {*|Parse.Relation}
     */
    ParseMobx.prototype.relation = function (attr) {
        return this.parseObj.relation(attr);
    };
    /**
     *
     * @param key
     * @param value
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.remove = function (key, value) {
        this.checkDefined(key, []);
        if (this.checkType(key, 'Array')) {
            if (this.attributes[key].indexOf(value) !== -1) {
                this.attributes[key].splice(this.attributes[key].indexOf(value), 1);
            }
        }
        this.parseObj.remove(key, value);
        return this;
    };
    /**
     *
     * @param attr
     * @param items
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.removeAll = function (attr, items) {
        var _this = this;
        this.checkDefined(attr, []);
        if (this.checkType(attr, 'Array')) {
            items.forEach(function (item) {
                if (_this.attributes[attr].indexOf(item) !== -1) {
                    _this.attributes[attr].splice(_this.attributes[attr].indexOf(item), 1);
                }
            });
        }
        this.parseObj.removeAll(attr, items);
        return this;
    };
    /**
     *
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.revert = function () {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        this.parseObj.revert();
        return new ParseMobx(this.parseObj);
    };
    /**
     *
     * @returns {Promise<void>}
     */
    ParseMobx.prototype.save = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.parseObj
                .save(options)
                .then(function () {
                (0, mobx_1.runInAction)(function () {
                    return _this.set('updatedAt', new Date().toISOString(), undefined);
                });
                resolve(_this);
            })
                .catch(reject);
        });
    };
    /**
     *
     * @param options
     */
    ParseMobx.prototype.saveEventually = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.parseObj
                .saveEventually(options)
                .then(function () {
                (0, mobx_1.runInAction)(function () {
                    return _this.set('updatedAt', new Date().toISOString(), undefined);
                });
                resolve(_this);
            })
                .catch(reject);
        });
    };
    /**
     *
     * @param key
     * @param value
     * @param options
     */
    ParseMobx.prototype.set = function (key, value, options) {
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
            }
            else {
                this.attributes[key] = value;
            }
        }
        else {
            var objToExtend = {};
            objToExtend[key] = value;
            (0, mobx_1.extendObservable)(this.attributes, objToExtend);
        }
        this.parseObj.set(key, value, options);
        return this;
    };
    /**
     *
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.setACL = function (acl, options) {
        this.parseObj.setACL(acl, options);
        return this;
    };
    /**
     *
     * @returns {*}
     */
    ParseMobx.prototype.toJSON = function () {
        return this.parseObj.toJSON();
    };
    /**
     *
     * @returns {ParseMobx}
     */
    ParseMobx.prototype.toPointer = function () {
        return this.parseObj.toPointer();
    };
    /**
     *
     */
    ParseMobx.prototype.unPin = function () {
        return this.parseObj.unPin();
    };
    /**
     *
     * @param name
     */
    ParseMobx.prototype.unPinWithName = function (name) {
        return this.parseObj.unPinWithName(name);
    };
    /**
     *
     * @param attr
     * @param options
     */
    ParseMobx.prototype.unset = function (attr, options) {
        this.parseObj.unset(attr, options);
        if (this.attributes[attr]) {
            delete this.attributes[attr];
        }
        return this;
    };
    /**
     *
     * @param attrs
     * @returns {*|boolean|_ParseError.default|void|string|ActiveX.IXMLDOMParseError}
     */
    ParseMobx.prototype.validate = function (attrs, options) {
        return this.parseObj.validate(attrs, options);
    };
    /**
     *
     * @returns {ParseObject}
     */
    ParseMobx.prototype.getParseObject = function () {
        return this.parseObj;
    };
    /**
     *
     * @param key
     * @param value
     * @private
     */
    ParseMobx.prototype.checkDefined = function (key, initValue) {
        if (typeof this.attributes[key] === 'undefined') {
            var objToExtend = {};
            objToExtend[key] = initValue;
            (0, mobx_1.extendObservable)(this.attributes, objToExtend);
        }
    };
    /**
     *
     * @param key
     * @param type
     * @private
     */
    ParseMobx.prototype.checkType = function (key, type) {
        return this.attributes[key].constructor.name === type;
    };
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "add", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "addAll", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "addAllUnique", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "addUnique", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "increment", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "remove", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "removeAll", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "revert", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "save", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "saveEventually", null);
    __decorate([
        mobx_1.action
    ], ParseMobx.prototype, "set", null);
    return ParseMobx;
}());
exports.ParseMobx = ParseMobx;
