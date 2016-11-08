'use strict';

const expectToReject = require('jasmine-promise-tools').expectToReject;
const q = require('q');
const pactBuilder = require('./support/pact-builder');
const swaggerBuilder = require('./support/swagger-builder');
const swaggerPactValidatorLoader = require('./support/swagger-pact-validator-loader');
const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator reading urls', () => {
    let mockUrls;
    let mockHttpClient;
    let swaggerPactValidator;

    beforeEach(() => {
        mockUrls = {};
        mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient(mockUrls);
        const mockFileSystem = swaggerPactValidatorLoader.createMockFileSystem({});

        swaggerPactValidator = swaggerPactValidatorLoader.createInstance(mockFileSystem, mockHttpClient);
    });

    describe('reading the swagger file', () => {
        it('should make a request for a http swagger url', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = swaggerPactValidator.validate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return result.then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/swagger.json');
            });
        }));

        it('should make a request for a https swagger url', willResolve(() => {
            mockUrls['https://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = swaggerPactValidator.validate(
                'https://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return result.then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('https://domain.com/swagger.json');
            });
        }));

        it('should return the error when making the request fails', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q.reject(new Error('error-message'));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = swaggerPactValidator.validate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return expectToReject(result).then((error) =>
                expect(error).toEqual(new Error('Unable to read "http://domain.com/swagger.json": error-message'))
            );
        }));

        it('should return the error when the swagger file cannot be parsed as json', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q('');
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = swaggerPactValidator.validate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return expectToReject(result).then((error) => {
                expect(error).toEqual(
                    new Error('Unable to parse "http://domain.com/swagger.json" as json: Unexpected end of JSON input')
                );
            });
        }));
    });

    describe('reading the pact file', () => {
        it('should make a request for a http pact url', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = swaggerPactValidator.validate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return result.then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/pact.json');
            });
        }));

        it('should return the error when reading the pact file fails', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q.reject(new Error('error-message'));

            const result = swaggerPactValidator.validate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return expectToReject(result).then((error) =>
                expect(error).toEqual(new Error('Unable to read "http://domain.com/pact.json": error-message'))
            );
        }));

        it('should return the error when the pact file cannot be parsed as json', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q('');

            const result = swaggerPactValidator.validate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return expectToReject(result).then((error) => {
                expect(error).toEqual(
                    new Error('Unable to parse "http://domain.com/pact.json" as json: Unexpected end of JSON input')
                );
            });
        }));
    });
});
