import {isMediaTypeSupported} from '../../lib/swagger-mock-validator/validate-spec-and-mock/content-negotiation';
import {CustomMatchers} from './support/custom-jasmine-matchers';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('content negotiation', () => {
    it('should return false when the supported media types array is empty', () => {
        const result = isMediaTypeSupported('application/json', []);

        expect(result).toBe(false);
    });

    it('should return true when the actual media type matches supported single media type array', () => {
        const result = isMediaTypeSupported('application/json', ['application/json']);

        expect(result).toBe(true);
    });

    it('should return false when the actual media type does not match supported single media type array', () => {
        const result = isMediaTypeSupported('application/json', ['text/html']);

        expect(result).toBe(false);
    });

    it('should return true when the actual media type matches at least one of the supported media types', () => {
        const result = isMediaTypeSupported('application/json', ['text/html', 'application/json']);

        expect(result).toBe(true);
    });

    it('should return true when the actual media type without parameters matches supported media type array', () => {
        const result = isMediaTypeSupported('application/json; charset=utf-8', ['application/json']);

        expect(result).toBe(true);
    });

    it('should return true when actual media type matches supported media type with parameters in the array', () => {
        const result = isMediaTypeSupported('application/json', ['application/json; charset=utf-8']);

        expect(result).toBe(true);
    });

    it('should return true when the actual media type surrounded with spaces matches supported', () => {
        const result = isMediaTypeSupported(' application/json ', ['application/json']);

        expect(result).toBe(true);
    });

    it('should return true when the actual media type matches supported media type surrounded with spaces', () => {
        const result = isMediaTypeSupported('application/json', [' application/json ']);

        expect(result).toBe(true);
    });

    it('should return true when the actual media type with charset and spaces matches supported media type', () => {
        const result = isMediaTypeSupported('application/json ; charset=utf-8 ', ['application/json']);

        expect(result).toBe(true);
    });

    it('should return true when actual type wildcard media matches supported media type', () => {
        const result = isMediaTypeSupported('*/*', ['application/json']);

        expect(result).toBe(true);
    });

    it('should return false when actual type wildcard media is compared against an empty supported array', () => {
        const result = isMediaTypeSupported('*/*', []);

        expect(result).toBe(false);
    });

    it('should return true when actual media type matches type wildcard supported media type', () => {
        const result = isMediaTypeSupported('application/json', ['*/*']);

        expect(result).toBe(true);
    });

    it('should return true when actual subtype wildcard media matches supported media type', () => {
        const result = isMediaTypeSupported('application/*', ['application/json']);

        expect(result).toBe(true);
    });

    it('should return true when actual media matches subtype wildcard supported media type', () => {
        const result = isMediaTypeSupported('application/json', ['application/*']);

        expect(result).toBe(true);
    });

    it('should return false when actual subtype wildcard media does not match supported media type', () => {
        const result = isMediaTypeSupported('application/*', ['text/html']);

        expect(result).toBe(false);
    });

    it('should return false when actual media does not match supported subtype wildcard media type', () => {
        const result = isMediaTypeSupported('text/html', ['application/*']);

        expect(result).toBe(false);
    });

    it('should return false when actual subtype wildcard media matches supported media type but type does not', () => {
        const result = isMediaTypeSupported('application/*', ['text/*']);

        expect(result).toBe(false);
    });

    it('should compare actual with supported media types in a case insensitive fashion', () => {
        const result = isMediaTypeSupported('Application/Json', ['application/json']);

        expect(result).toBe(true);
    });

    it('should try to compare invalid mime types without subtype', () => {
        const result = isMediaTypeSupported('application', ['application']);

        expect(result).toBe(true);
    });

    it('should try to compare invalid mime types with multiple subtypes up to the first subtype', () => {
        const result = isMediaTypeSupported('text/plain/html', ['text/plain/css']);

        expect(result).toBe(true);
    });
});
