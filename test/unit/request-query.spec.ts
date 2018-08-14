import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';
import {swagger2Builder} from './support/swagger2-builder';
import {operationBuilder} from './support/swagger2-builder/operation-builder';
import {ParameterBuilder} from './support/swagger2-builder/parameter-builder';
import {queryParameterBuilder} from './support/swagger2-builder/parameter-builder/query-parameter-builder';
import {pathBuilder} from './support/swagger2-builder/path-builder';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('request query', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with spec file "spec.json"';
    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist')
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const validateRequestQuery = (
        swaggerQueryParameter?: ParameterBuilder,
        pactRequestQuery?: string
    ) => {

        const interaction = pactRequestQuery
            ? defaultInteractionBuilder.withRequestQuery(pactRequestQuery)
            : defaultInteractionBuilder;

        const pactFile = pactBuilder.withInteraction(interaction).build();

        const operation = swaggerQueryParameter
            ? operationBuilder.withParameter(swaggerQueryParameter)
            : operationBuilder;

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder.withGetOperation(operation))
            .build();

        return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact request query matches the spec', async () => {
        const requestQuery = 'value=1';
        const queryParameter = queryParameterBuilder.withRequiredNumberNamed('value');

        const result = await validateRequestQuery(queryParameter, requestQuery);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass when the pact request query with multiple values matches the spec', async () => {
        const requestQuery = 'value=1&value=2';
        const queryParameter = queryParameterBuilder.withRequiredArrayOfNumbersNamed('value', 'multi');

        const result = await validateRequestQuery(queryParameter, requestQuery);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return the error when the pact request query does not match the spec', async () => {
        const requestQuery = 'value=a';
        const queryParameter = queryParameterBuilder.withRequiredNumberNamed('value');

        const result = await validateRequestQuery(queryParameter, requestQuery);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.query.incompatible',
            message: 'Value is incompatible with the parameter defined in the spec file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.query.value',
                mockFile: 'pact.json',
                value: 'a'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0]',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: queryParameter.build()
            },
            type: 'error'
        }]);
    });

    it('should fail when the pact request query has different case than the defined in the spec', async () => {
        const requestQuery = 'VALUE=1';
        const queryParameter = queryParameterBuilder.withRequiredNumberNamed('value');

        const result = await validateRequestQuery(queryParameter, requestQuery);

        expect(result).toContainErrors([{
            code: 'request.query.incompatible',
            message: 'Value is incompatible with the parameter defined in the spec file: '
            + 'should have required property \'value\'',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.withRequestQuery(requestQuery).build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0]',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: queryParameter.build()
            },
            type: 'error'
        }]);
    });

    it('should return the error when the pact request query is missing a required parameter', async () => {
        const queryParameter = queryParameterBuilder.withRequiredNumberNamed('value');
        const result = await validateRequestQuery(queryParameter);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.query.incompatible',
            message: 'Value is incompatible with the parameter defined in the spec file: ' +
            'should have required property \'value\'',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0]',
                mockFile: 'pact.json',
                value: defaultInteractionBuilder.build()
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0]',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: queryParameter.build()
            },
            type: 'error'
        }]);
    });

    it('should return a warning when the pact request query is not defined in the spec', async () => {
        const requestQuery = 'value=a';
        const result = await validateRequestQuery(undefined, requestQuery);

        expect(result).toContainNoErrors();
        expect(result).toContainWarnings([{
            code: 'request.query.unknown',
            message: 'Query parameter is not defined in the spec file: value',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.query.value',
                mockFile: 'pact.json',
                value: 'a'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: operationBuilder.build()
            },
            type: 'warning'
        }]);
    });

    it('should return the error when the pact request query does not match the collection format', async () => {
        const requestQuery = 'value=1&value=2';
        const queryParameter = queryParameterBuilder.withRequiredArrayOfNumbersNamed('value', 'csv');

        const result = await validateRequestQuery(queryParameter, requestQuery);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.query.incompatible',
            message: 'Value is incompatible with the parameter defined in the spec file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.query.value',
                mockFile: 'pact.json',
                value: '1[multi-array-separator]2'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0]',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: queryParameter.build()
            },
            type: 'error'
        }]);
    });
});
