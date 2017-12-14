import * as _ from 'lodash';

const setMutableValueOn = <T extends object>(obj: T, path: string, mutableValue: any): T =>
    _.set<T>(_.cloneDeep(obj), path, mutableValue);

export function addToArrayOn(obj: any, path: string, value: any) {
    const copyOfArray = _.cloneDeep(_.get<any[]>(obj, path, []));
    const copyOfValue = _.cloneDeep(value);

    copyOfArray.push(copyOfValue);

    return setMutableValueOn(obj, path, copyOfArray);
}

export function removeValueOn(obj: any, path: string) {
    const copyOfObj = _.cloneDeep(obj);

    _.unset(copyOfObj, path);

    return copyOfObj;
}

export function setValueOn<T extends object>(obj: T, path: string, value: any): T {
    return setMutableValueOn(obj, path, _.cloneDeep(value));
}

export function setValuesOn(obj: any, values: {[name: string]: any}) {
    const copyOfObj = _.cloneDeep(obj);
    const copyOfValues = _.cloneDeep(values);

    return _.reduce(
        copyOfValues,
        (updatedCopyOfObj, value, path) => _.set(updatedCopyOfObj, path, value),
        copyOfObj
    );
}
