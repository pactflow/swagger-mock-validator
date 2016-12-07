import {expectToReject, willResolve} from 'jasmine-promise-tools';
import * as q from 'q';
import {FileSystem, HttpClient, SwaggerPactValidator, ValidationSuccess} from '../../lib/swagger-pact-validator/types';
import {pactBuilder} from './support/pact-builder';
import {swaggerBuilder} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

describe('swagger-pact-validator reading urls', () => {
    let mockFileSystem: FileSystem;
    let mockHttpClient: HttpClient;
    let mockUrls: {[url: string]: q.Promise<string>};
    let swaggerPactValidator: SwaggerPactValidator;

    beforeEach(() => {
        mockUrls = {};
        mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient(mockUrls);
        mockFileSystem = swaggerPactValidatorLoader.createMockFileSystem({});

        swaggerPactValidator = swaggerPactValidatorLoader.createInstance();
    });

    const invokeValidate = (swaggerPathOrUrl: string, pactPathOrUrl: string): Promise<ValidationSuccess> =>
        swaggerPactValidator.validate({
            fileSystem: mockFileSystem,
            httpClient: mockHttpClient,
            pactPathOrUrl,
            swaggerPathOrUrl
        }) as any;

    describe('reading the swagger file', () => {
        it('should make a request for a http swagger url', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = invokeValidate(
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

            const result = invokeValidate(
                'https://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return result.then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('https://domain.com/swagger.json');
            });
        }));

        it('should return the error when making the request fails', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q.reject<string>(new Error('error-message'));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = invokeValidate(
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

            const result = invokeValidate(
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

            const result = invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return result.then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/pact.json');
            });
        }));

        it('should return the error when reading the pact file fails', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q.reject<string>(new Error('error-message'));

            const result = invokeValidate(
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

            const result = invokeValidate(
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
