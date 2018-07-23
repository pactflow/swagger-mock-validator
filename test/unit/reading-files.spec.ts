import * as yaml from 'js-yaml';
import {ValidationOutcome} from '../../lib/api-types';
import {SwaggerMockValidatorErrorImpl} from '../../lib/swagger-mock-validator/swagger-mock-validator-error-impl';
import {FileSystem} from '../../lib/swagger-mock-validator/types';
import {expectToFail} from '../support/expect-to-fail';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {pactBuilder} from './support/pact-builder';
import {swaggerBuilder} from './support/swagger-builder';
import {MockFileSystemResponses, swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('reading files', () => {
    let mockFiles: MockFileSystemResponses;
    let mockFileSystem: FileSystem;

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);

        mockFiles = {};
        mockFileSystem = swaggerMockValidatorLoader.createMockFileSystem(mockFiles);
    });

    const invokeValidate = (specPathOrUrl: string, mockPathOrUrl: string): Promise<ValidationOutcome> =>
        swaggerMockValidatorLoader.invokeWithMocks({
            fileSystem: mockFileSystem,
            mockPathOrUrl,
            specPathOrUrl
        }) as any;

    describe('reading the swagger file', () => {
        it('should read the json swagger file from the file system', async () => {
            mockFiles['swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate('swagger.json', 'pact.json');

            expect(mockFileSystem.readFile).toHaveBeenCalledWith('swagger.json');
        });

        it('should read the yaml swagger file from the file system', async () => {
            mockFiles['swagger.yaml'] = Promise.resolve(yaml.safeDump(swaggerBuilder.build()));
            mockFiles['pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate('swagger.yaml', 'pact.json');

            expect(mockFileSystem.readFile).toHaveBeenCalledWith('swagger.yaml');
        });

        it('should throw an error when reading the swagger file fails', async () => {
            mockFiles['swagger.json'] = Promise.reject(new Error('error-message'));
            mockFiles['pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            const error = await expectToFail(invokeValidate('swagger.json', 'pact.json'));

            expect(error).toEqual(
                new SwaggerMockValidatorErrorImpl(
                    'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                    'Unable to read "swagger.json": error-message'
                )
            );
        });

        it('should throw an error when the swagger file cannot be parsed', async () => {
            mockFiles['swagger.json'] = Promise.resolve('');
            mockFiles['pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            const error = await expectToFail(
                invokeValidate('swagger.json', 'pact.json')) as SwaggerMockValidatorErrorImpl;

            expect(error.code).toEqual('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR');
            expect(error.message)
                .toEqual(jasmine.stringMatching('Unable to parse "swagger.json":'));
        });

        it('should return the error when the swagger file is not valid', async () => {
            mockFiles['swagger.json'] = Promise.resolve('{}');
            mockFiles['pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            const error = await expectToFail(invokeValidate('swagger.json', 'pact.json'));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
                'Unable to parse "swagger.json": [object Object] is not a valid Openapi API definition'
            ));
        });
    });

    describe('reading the pact file', () => {
        it('should read the pact file from the file system', async () => {
            mockFiles['swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate('swagger.json', 'pact.json');

            expect(mockFileSystem.readFile).toHaveBeenCalledWith('pact.json');
        });

        it('should fail when reading the pact file fails', async () => {
            mockFiles['swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = Promise.reject(new Error('error-message'));

            const error = await expectToFail(invokeValidate('swagger.json', 'pact.json'));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                'Unable to read "pact.json": error-message'
            ));
        });

        it('should fail when the pact file cannot be parsed as json', async () => {
            mockFiles['swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = Promise.resolve('');

            const error = await expectToFail(
                invokeValidate('swagger.json', 'pact.json')) as SwaggerMockValidatorErrorImpl;

            expect(error.code).toEqual('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR');
            expect(error.message).toEqual(jasmine.stringMatching('Unable to parse "pact.json":'));
        });

        it('should return the error when the pact file is not valid', async () => {
            const pact = pactBuilder.withMissingInteractions();

            mockFiles['swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = Promise.resolve(JSON.stringify(pact.build()));

            const error = await expectToFail(invokeValidate('swagger.json', 'pact.json'));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
                'Unable to parse "pact.json": Missing required property: interactions'
            ));
        });
    });
});
