import {expectToReject, willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    parameterBuilder,
    ParameterBuilder,
    pathBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

declare function expect(actual: any): CustomMatchers;

describe('swagger-pact-validator request query', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');
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

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operation))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when the pact request query matches the spec', willResolve(() => {
        const requestQuery = 'value=1';
        const queryParameter = parameterBuilder.withRequiredNumberInQueryNamed('value');

        return validateRequestQuery(queryParameter, requestQuery).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should pass when the pact request query matches the spec', willResolve(() => {
        const requestQuery = 'value=1&value=2';
        const queryParameter = parameterBuilder.withRequiredArrayOfNumbersInQueryNamed('value', 'multi');

        return validateRequestQuery(queryParameter, requestQuery).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when the pact request query does not match the spec', willResolve(() => {
        const requestQuery = 'value=a';
        const queryParameter = parameterBuilder.withRequiredNumberInQueryNamed('value');

        const result = validateRequestQuery(queryParameter, requestQuery);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Value is incompatible with the parameter defined in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.query.value',
                    pactFile: 'pact.json',
                    value: 'a'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: queryParameter.build()
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when the pact request query is missing a required parameter', willResolve(() => {
        const queryParameter = parameterBuilder.withRequiredNumberInQueryNamed('value');
        const result = validateRequestQuery(queryParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                'should have required property \'value\'',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0]',
                    pactFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: queryParameter.build()
                },
                type: 'error'
            }]);
        });
    }));

    it('should return a warning when the pact request query is not defined in the spec', willResolve(() => {
        const requestQuery = 'value=a';
        return validateRequestQuery(undefined, requestQuery).then((result) => {
            expect(result).toContainWarnings([{
                message: 'Query parameter is not defined in the swagger file: value',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.query.value',
                    pactFile: 'pact.json',
                    value: 'a'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: operationBuilder.build()
                },
                type: 'warning'
            }]);
        });
    }));

    it('should return the error when the pact request query does not match the collection format', willResolve(() => {
        const requestQuery = 'value=1&value=2';
        const queryParameter = parameterBuilder.withRequiredArrayOfNumbersInQueryNamed('value', 'csv');

        const result = validateRequestQuery(queryParameter, requestQuery);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Value is incompatible with the parameter defined in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.query.value',
                    pactFile: 'pact.json',
                    value: '1[multi-array-separator]2'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0]',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: queryParameter.build()
                },
                type: 'error'
            }]);
        });
    }));
});
