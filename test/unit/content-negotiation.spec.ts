import { findMatchingType } from '../../lib/swagger-mock-validator/validate-spec-and-mock/content-negotiation';
import { CustomMatchers } from './support/custom-jasmine-matchers';

declare function expect<T>(actual: T): CustomMatchers<T>;

// legacy tests retained for regression testing
describe('content negotiation', () => {
    it('should return false when the supported media types array is empty', () => {
        const result = findMatchingType('application/json', []);

        expect(result).toBeFalsy();
    });

    it('should return true when the actual media type matches supported single media type array', () => {
        const result = findMatchingType('application/json', ['application/json']);

        expect(result).toBeTruthy();
    });

    it('should return false when the actual media type does not match supported single media type array', () => {
        const result = findMatchingType('application/json', ['text/html']);

        expect(result).toBeFalsy();
    });

    it('should return true when the actual media type matches at least one of the supported media types', () => {
        const result = findMatchingType('application/json', ['text/html', 'application/json']);

        expect(result).toBeTruthy();
    });

    it('should return true when the actual media type without parameters matches supported media type array', () => {
        const result = findMatchingType('application/json; charset=utf-8', ['application/json']);

        expect(result).toBeTruthy();
    });

    it('should return true when actual media type matches supported media type with parameters in the array', () => {
        const result = findMatchingType('application/json', ['application/json; charset=utf-8']);

        expect(result).toBeTruthy();
    });

    it('should return true when the actual media type surrounded with spaces matches supported', () => {
        const result = findMatchingType(' application/json ', ['application/json']);

        expect(result).toBeTruthy();
    });

    it('should return true when the actual media type matches supported media type surrounded with spaces', () => {
        const result = findMatchingType('application/json', [' application/json ']);

        expect(result).toBeTruthy();
    });

    it('should return true when the actual media type with charset and spaces matches supported media type', () => {
        const result = findMatchingType('application/json ; charset=utf-8 ', ['application/json']);

        expect(result).toBeTruthy();
    });

    it('should return true when actual type wildcard media matches supported media type', () => {
        const result = findMatchingType('*/*', ['application/json']);

        expect(result).toBeTruthy();
    });

    it('should return false when actual type wildcard media is compared against an empty supported array', () => {
        const result = findMatchingType('*/*', []);

        expect(result).toBeFalsy();
    });

    it('should return true when actual media type matches type wildcard supported media type', () => {
        const result = findMatchingType('application/json', ['*/*']);

        expect(result).toBeTruthy();
    });

    it('should return true when actual subtype wildcard media matches supported media type', () => {
        const result = findMatchingType('application/*', ['application/json']);

        expect(result).toBeTruthy();
    });

    it('should return true when actual media matches subtype wildcard supported media type', () => {
        const result = findMatchingType('application/json', ['application/*']);

        expect(result).toBeTruthy();
    });

    it('should return false when actual subtype wildcard media does not match supported media type', () => {
        const result = findMatchingType('application/*', ['text/html']);

        expect(result).toBeFalsy();
    });

    it('should return false when actual media does not match supported subtype wildcard media type', () => {
        const result = findMatchingType('text/html', ['application/*']);

        expect(result).toBeFalsy();
    });

    it('should return false when actual subtype wildcard media matches supported media type but type does not', () => {
        const result = findMatchingType('application/*', ['text/*']);

        expect(result).toBeFalsy();
    });

    it('should compare actual with supported media types in a case insensitive fashion', () => {
        const result = findMatchingType('Application/Json', ['application/json']);

        expect(result).toBeTruthy();
    });

    it('should try to compare invalid mime types without subtype', () => {
        const result = findMatchingType('application', ['application']);

        expect(result).toBeTruthy();
    });

    it('should try to compare invalid mime types with multiple subtypes up to the first subtype', () => {
        const result = findMatchingType('text/plain/html', ['text/plain/css']);

        expect(result).toBeTruthy();
    });
});

// more specific tests
describe('#findMatchingType', () => {
    describe('exact matches', () => {
        it('matches none', () => {
            expect(findMatchingType('xxx', ['aaa', 'bbb'])).toBe(undefined);
        });

        it('matches one', () => {
            expect(findMatchingType('aaa', ['aaa', 'bbb'])).toBe('aaa');
            expect(findMatchingType('bbb', ['aaa', 'bbb'])).toBe('bbb');
        });

        it('matches one of many', () => {
            expect(findMatchingType('aaa,xxx', ['aaa', 'bbb'])).toBe('aaa');
            expect(findMatchingType('xxx,aaa', ['aaa', 'bbb'])).toBe('aaa');
            expect(findMatchingType('bbb,xxx', ['aaa', 'bbb'])).toBe('bbb');
            expect(findMatchingType('xxx,bbb', ['aaa', 'bbb'])).toBe('bbb');
        });

        it('matches one of many, ignoring whitespaces', () => {
            expect(findMatchingType('aaa, xxx', ['aaa', 'bbb'])).toBe('aaa');
            expect(findMatchingType('xxx, aaa', ['aaa', 'bbb'])).toBe('aaa');
            expect(findMatchingType('bbb, xxx', ['aaa', 'bbb'])).toBe('bbb');
            expect(findMatchingType('xxx, bbb', ['aaa', 'bbb'])).toBe('bbb');
        });
    });

    describe('with parameters', () => {
        it('matches none', () => {
            expect(findMatchingType('aaa;v3', ['aaa;v1', 'aaa;v2'])).toBe(undefined);
        });

        it('prefers exact matches, but falls back accordingly', () => {
            expect(findMatchingType('aaa;v2', ['aaa', 'aaa;v2'])).toBe('aaa;v2');
            expect(findMatchingType('aaa', ['aaa', 'aaa;v2'])).toBe('aaa');
            expect(findMatchingType('aaa;v2', ['aaa'])).toBe('aaa');
        });

        it('prefers exact matches, but falls back accordingly, ignoring whitespaces', () => {
            expect(findMatchingType('aaa; v2', ['aaa', 'aaa;v2'])).toBe('aaa;v2');
            expect(findMatchingType('aaa;v2', ['aaa', 'aaa; v2'])).toBe('aaa; v2');
            expect(findMatchingType('aaa', ['aaa', 'aaa; v2'])).toBe('aaa');
            expect(findMatchingType('aaa; v2', ['aaa'])).toBe('aaa');
        });
    });

    describe('extensions', () => {
        it('matches exactly', () => {
            expect(findMatchingType('application/vnd.foo+json', ['application/json', 'application/vnd.foo+json'])).toBe(
                'application/vnd.foo+json'
            );
            expect(findMatchingType('application/json', ['application/json', 'application/vnd.foo+json'])).toBe(
                'application/json'
            );
        });

        it('fallsback to base content-type', () => {
            expect(findMatchingType('application/vnd.foo+json', ['application/json'])).toBe('application/json');
        });

        it('uses extended content-type', () => {
            expect(findMatchingType('application/json', ['application/vnd.foo+json'])).toBe('application/vnd.foo+json');
        });
    });

    describe('wildcard responses', () => {
        it('matches wildcard types', () => {
            expect(findMatchingType('aaa', ['aaa/*'])).toBe('aaa/*');
            expect(findMatchingType('aaa/*', ['aaa;v2'])).toBe('aaa;v2');
            expect(findMatchingType('aaa/*', ['aaa/bbb'])).toBe('aaa/bbb');
            expect(findMatchingType('aaa/*', ['aaa/bbb;v2'])).toBe('aaa/bbb;v2');
        });
    });

    describe('wildcard requests', () => {
        it('matches wildcard types', () => {
            expect(findMatchingType('aaa/*', ['aaa'])).toBe('aaa');
            expect(findMatchingType('aaa/*', ['aaa;v2'])).toBe('aaa;v2');
            expect(findMatchingType('aaa/*', ['aaa/bbb'])).toBe('aaa/bbb');
            expect(findMatchingType('aaa/*', ['aaa/bbb;v2'])).toBe('aaa/bbb;v2');
        });

        it('matches wildcard types and subtypes', () => {
            expect(findMatchingType('*/*', ['*/*'])).toBe('*/*');
            expect(findMatchingType('*/*', ['aaa', '*/*'])).toBe('*/*');
            expect(findMatchingType('*/*', ['aaa'])).toBe('aaa');
            expect(findMatchingType('*/*', ['aaa/bbb'])).toBe('aaa/bbb');
        });

        // it('impossible scenario', () => {
        //     expect(findMatchingType('*/aaa', [])).toBe('impossible scenario');
        // });
    });

    describe('multiple valid responses', () => {
        it('sorts by q-factor', () => {
            expect(findMatchingType('aaa, bbb;q=0.8', ['aaa', 'bbb'])).toBe('aaa');
            expect(findMatchingType('aaa;q=1, bbb;q=0.8', ['aaa', 'bbb'])).toBe('aaa');
            expect(findMatchingType('aaa;q=0.8, bbb;q=1.0', ['aaa', 'bbb'])).toBe('bbb');
            expect(findMatchingType('aaa;q=0.8, bbb', ['aaa', 'bbb'])).toBe('bbb');

            expect(findMatchingType('aaa, aaa;v2;q=0.8', ['aaa', 'aaa;v2'])).toBe('aaa');
            expect(findMatchingType('aaa;q=0.8, aaa;v2', ['aaa', 'aaa;v2'])).toBe('aaa;v2');
        });
    });
});
