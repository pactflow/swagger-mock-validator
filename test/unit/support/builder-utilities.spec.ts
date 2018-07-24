import { setIfDefined } from './builder-utilities';

describe('builder-utilities', () => {
    describe('setIfDefined', () => {
        it('should set the property on the object if the value is defined', () => {
            const obj: {property?: number} = {};
            setIfDefined(obj, 'property', 1);
            expect(obj).toEqual({property: 1});
        });

        it('should not set the property on the object if the value is not defined', () => {
            const obj: {property?: number} = {};
            setIfDefined(obj, 'property', undefined);
            expect(obj).toEqual({});
        });

        it('should set the property on the object if the value is falsey but not undefined', () => {
            const obj: {property?: number} = {};
            setIfDefined(obj, 'property', 0);
            expect(obj).toEqual({property: 0});
        });

        it('should make a deep copy of the value it is setting', () => {
            const obj: {property?: number[]} = {};
            const arr: number[] = [];
            setIfDefined(obj, 'property', arr);
            arr.push(1);
            expect(obj).toEqual({property: []});
        });
    });
});
