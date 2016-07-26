'use strict';

const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator', () => {
    it('should pass', () => {
        expect(true).toBe(true);
    });

    const doSomethingAsync = () =>
        new Promise((resolve) => {
            setTimeout(resolve, 10);
        });

    it('should pass async', willResolve(() => doSomethingAsync()));
});
