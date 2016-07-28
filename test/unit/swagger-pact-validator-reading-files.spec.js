'use strict';

const expectToReject = require('jasmine-promise-tools').expectToReject;
const q = require('q');
const pactBuilder = require('./support/pact-builder');
const swaggerBuilder = require('./support/swagger-builder');
const swaggerPactValidatorLoader = require('./support/swagger-pact-validator-loader');
const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator reading files', () => {
    let mockFiles;
    let mockFileSystem;
    let swaggerPactValidator;

    beforeEach(() => {
        mockFiles = {};
        mockFileSystem = swaggerPactValidatorLoader.createMockFileSystem(mockFiles);
        swaggerPactValidator = swaggerPactValidatorLoader.createInstance(mockFileSystem);
    });

    describe('reading the swagger file', () => {
        it('should read the swagger file from the file system', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            return swaggerPactValidator.validate('swagger.json', 'pact.json').then(() => {
                expect(mockFileSystem.readFile).toHaveBeenCalledWith('swagger.json');
            });
        }));

        it('should return the error when reading the swagger file fails', willResolve(() => {
            mockFiles['swagger.json'] = q.reject(new Error('error-message'));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to read file "swagger.json": error-message'));
            });
        }));

        it('should return the error when the swagger file cannot be parsed as json', willResolve(() => {
            mockFiles['swagger.json'] = q('');
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(
                    new Error('Unable to parse file "swagger.json" as json: Unexpected end of input')
                );
            });
        }));

        it('should return the error when the swagger file is not valid', willResolve(() => {
            mockFiles['swagger.json'] = q('{}');
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('File "swagger.json" is not a valid swagger file'));
                expect(error.details).toEqual({
                    errors: [{
                        location: '[swaggerRoot]',
                        message: 'Missing required property: paths'
                    }, {
                        location: '[swaggerRoot]',
                        message: 'Missing required property: info'
                    }, {
                        location: '[swaggerRoot]',
                        message: 'Missing required property: swagger'
                    }]
                });
            });
        }));

        it('should indicate the location where the validation error was found', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.withMissingInfoTitle().build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error.details).toEqual({
                    errors: [{
                        location: '[swaggerRoot].info',
                        message: 'Missing required property: title'
                    }]
                });
            });
        }));
    });

    describe('reading the pact file', () => {
        it('should read the pact file from the file system', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            return swaggerPactValidator.validate('swagger.json', 'pact.json').then(() => {
                expect(mockFileSystem.readFile).toHaveBeenCalledWith('pact.json');
            });
        }));

        it('should return the error when reading the pact file fails', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q.reject(new Error('error-message'));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to read file "pact.json": error-message'));
            });
        }));

        it('should return the error when the pact file cannot be parsed as json', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q('');
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to parse file "pact.json" as json: Unexpected end of input'));
            });
        }));
    });
});
