'use strict';

const _ = require('lodash');

const setMutableValueOn = (obj, path, mutableValue) => _.set(_.cloneDeep(obj), path, mutableValue);

module.exports = {
    addToArrayOn (obj, path, value) {
        const copyOfArray = _.cloneDeep(_.get(obj, path, []));
        const copyOfValue = _.cloneDeep(value);

        copyOfArray.push(copyOfValue);

        return setMutableValueOn(obj, path, copyOfArray);
    },
    removeValueOn (obj, path) {
        const copyOfObj = _.cloneDeep(obj);

        _.unset(copyOfObj, path);

        return copyOfObj;
    },
    setValueOn (obj, path, value) {
        return setMutableValueOn(obj, path, _.cloneDeep(value));
    },
    setValuesOn (obj, values) {
        const copyOfObj = _.cloneDeep(obj);
        const copyOfValues = _.cloneDeep(values);

        return _.reduce(
            copyOfValues,
            (updatedCopyOfObj, value, path) => _.set(updatedCopyOfObj, path, value),
            copyOfObj
        );
    }
};
