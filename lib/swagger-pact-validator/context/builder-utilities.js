'use strict';

const cloneDeep = require('lodash').cloneDeep;
const get = require('lodash').get;
const unset = require('lodash').unset;
const set = require('lodash').set;

const setMutableValueOn = (obj, path, mutableValue) => set(cloneDeep(obj), path, mutableValue);

module.exports = {
    addToArrayOn (obj, path, value) {
        const copyOfArray = cloneDeep(get(obj, path, []));
        const copyOfValue = cloneDeep(value);

        copyOfArray.push(copyOfValue);

        return setMutableValueOn(obj, path, copyOfArray);
    },
    removeValueOn (obj, path) {
        const copyOfObj = cloneDeep(obj);

        unset(copyOfObj, path);

        return copyOfObj;
    },
    setValueOn (obj, path, value) {
        return setMutableValueOn(obj, path, cloneDeep(value));
    }
};
