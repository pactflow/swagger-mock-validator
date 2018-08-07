interface Dictionary<T> {
    [key: string]: T;
}

export const toMapWithLowerCaseKeys = <T>(originalMap: Dictionary<T>): Dictionary<T> =>
    Object.keys(originalMap).reduce<Dictionary<T>>((lowerCaseMap: Dictionary<T>, originalKey: string) => {
        lowerCaseMap[originalKey.toLowerCase()] = originalMap[originalKey];
        return lowerCaseMap;
    }, {});
