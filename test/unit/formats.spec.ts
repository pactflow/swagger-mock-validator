import _ from 'lodash';
import {ValidationOutcome} from '../../lib/api-types';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';
import {swagger2Builder} from './support/swagger2-builder';
import {definitionsBuilder} from './support/swagger2-builder/definitions-builder';
import {operationBuilder} from './support/swagger2-builder/operation-builder';
import {bodyParameterBuilder} from './support/swagger2-builder/parameter-builder/body-parameter-builder';
import {pathParameterBuilder} from './support/swagger2-builder/parameter-builder/path-parameter-builder';
import {pathBuilder, PathBuilder} from './support/swagger2-builder/path-builder';
import {responseBuilder} from './support/swagger2-builder/response-builder';
import {responseHeaderBuilder} from './support/swagger2-builder/response-header-builder';
import {schemaBuilder, SchemaBuilder} from './support/swagger2-builder/schema-builder';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('formats', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with spec file "spec.json"';

    const defaultSwaggerPathBuilder = pathBuilder.withGetOperation(operationBuilder);

    const invokeValidatorWithPath = (swaggerPath: PathBuilder, pactValue: string): Promise<ValidationOutcome> => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath(`/${pactValue}`)
            )
            .build();

        const swaggerFile = swagger2Builder
            .withPath('/{value}', swaggerPath)
            .build();

        return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
    };

    const invokeValidatorWithResponseBody = (pactResponseBody: any, swaggerBodySchema: SchemaBuilder) => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withResponseBody(pactResponseBody)
            )
            .build();

        const swaggerResponseBuilder = swaggerBodySchema
            ? responseBuilder.withSchema(swaggerBodySchema)
            : responseBuilder;

        const swaggerFile = swagger2Builder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withResponse(200, swaggerResponseBuilder))
            )
            .build();

        return swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
    };

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    describe('date parameters', () => {
        const swaggerPathWithDateBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withDateNamed('value'));

        it('should pass when the pact path matches a date param defined in the swagger', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDateBuilder, '2016-12-01');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when a pact has an incorrect type as a date param', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDateBuilder, '2016');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /2016',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/2016'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithDateBuilder.build()}
                },
                type: 'error'
            }]);
        });
    });

    describe('date-time parameters', () => {
        const swaggerPathWithDateTimeBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withDateTimeNamed('value'));

        it('should pass when the pact path matches a datetime param defined in the swagger', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDateTimeBuilder, '2016-12-01T01:30:00Z');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when a pact has an incorrect type as a datetime param', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDateTimeBuilder, '2016-12-01T');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /2016-12-01T',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/2016-12-01T'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithDateTimeBuilder.build()}
                },
                type: 'error'
            }]);
        });
    });

    describe('int32 parameters', () => {
        const swaggerPathWithInt32Builder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withInt32Named('value'));

        const minimumInt32Allowed = '-2147483648';
        const minimumInt32AllowedMinusOne = '-2147483649';
        const maximumInt32Allowed = '2147483647';
        const maximumInt32AllowedPlusOne = '2147483648';

        it('should pass when the pact path contains the minimum int32 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt32Builder, minimumInt32Allowed);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact path contains the maximum int32 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt32Builder, maximumInt32Allowed);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when a pact path contains smaller then the min int32 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt32Builder, minimumInt32AllowedMinusOne);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET /${minimumInt32AllowedMinusOne}`,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/${minimumInt32AllowedMinusOne}`
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithInt32Builder.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains bigger then the max int32 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt32Builder, maximumInt32AllowedPlusOne);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET /${maximumInt32AllowedPlusOne}`,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/${maximumInt32AllowedPlusOne}`
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithInt32Builder.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains non-integer int32 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt32Builder, '1.1');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET /1.1`,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/1.1`
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithInt32Builder.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains blank int32 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt32Builder, ' ');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET / `,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/ `
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithInt32Builder.build()}
                },
                type: 'error'
            }]);
        });

        it('should pass when the pact response body contains a valid int32 value', async () => {
            const pactResponseBody = {id: 1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt32());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact response body contains a valid int32 as root value', async () => {
            const pactResponseBody = 1;

            const swaggerBodySchema = schemaBuilder.withTypeInteger().withFormatInt32();

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when the pact response body contains a decimal int32 value', async () => {
            const pactResponseBody = {id: 1.1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt32());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should be integer',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: 1.1
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: 'integer'
                },
                type: 'error'
            }]);
        });

        it('should return the error when the pact response body contains a too large int32 value', async () => {
            const numberThatIsTooLarge = parseInt(maximumInt32AllowedPlusOne, 10);
            const pactResponseBody = {id: numberThatIsTooLarge};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt32());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should pass "formatInt32" keyword validation',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: numberThatIsTooLarge
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '' +
                    '[root].paths./does/exist.get.responses.200.schema.properties.id.formatInt32',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });
    });

    describe('int64 parameters', () => {
        const swaggerPathWithInt64Parameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withInt64Named('value'));

        const minimumInt64Allowed = '-9223372036854775808';
        const minimumInt64AllowedMinusOne = '-9223372036854775809';
        const maximumInt64Allowed = '9223372036854775807';
        const maximumInt64AllowedPlusOne = '9223372036854775808';

        it('should pass when the pact path contains the minimum int64 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt64Parameter, minimumInt64Allowed);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact path contains the maximum int64 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt64Parameter, maximumInt64Allowed);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when a pact path contains smaller then the min int64 value', async () => {
            const result = await invokeValidatorWithPath(
                swaggerPathWithInt64Parameter,
                minimumInt64AllowedMinusOne
            );

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: ' +
                `GET /${minimumInt64AllowedMinusOne}`,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/${minimumInt64AllowedMinusOne}`
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithInt64Parameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains bigger then the max int64 value', async () => {
            const result = await invokeValidatorWithPath(
                swaggerPathWithInt64Parameter,
                maximumInt64AllowedPlusOne
            );

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: ' +
                `GET /${maximumInt64AllowedPlusOne}`,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/${maximumInt64AllowedPlusOne}`
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithInt64Parameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains non-integer int64 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt64Parameter, '1.1');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET /1.1`,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/1.1`
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithInt64Parameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains blank int64 value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithInt64Parameter, ' ');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET / `,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/ `
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithInt64Parameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should pass when the pact response body contains a valid int64 value', async () => {
            const pactResponseBody = {id: 1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt64());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact response body contains a valid int64 value as a root value', async () => {
            const pactResponseBody = 1;

            const swaggerBodySchema = schemaBuilder.withTypeInteger().withFormatInt64();

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when the pact response body contains a decimal int64 value', async () => {
            const pactResponseBody = {id: 1.1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt64());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should be integer',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: 1.1
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: 'integer'
                },
                type: 'error'
            }]);
        });

        it('should return the error when the pact response body contains a too large int64 value', async () => {
            // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
            const pactResponseBody = {id: 12345678901234567890}; 

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt64());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should pass "formatInt64" keyword validation',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
                    value: 12345678901234567000
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '' +
                    '[root].paths./does/exist.get.responses.200.schema.properties.id.formatInt64',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });
    });

    describe('float parameters', () => {
        const swaggerPathWithFloatParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withFloatNamed('value'));

        it('should pass when the pact path contains a value with 5 significant digits', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithFloatParameter, '12345');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact path contains a value with 6 significant digits', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithFloatParameter, '123456');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when pact path contains a value with 6 sig digits involving decimals', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithFloatParameter, '00123.45600');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when pact path contains a value with 7 significant digits', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithFloatParameter, '1234567');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /1234567',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/1234567'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithFloatParameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains non-numeric float value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithFloatParameter, 'a');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET /a`,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/a`
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithFloatParameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains blank float value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithFloatParameter, ' ');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET / `,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/ `
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithFloatParameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should pass when the pact response body contains a valid float value', async () => {
            const pactResponseBody = {id: 1.1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatFloat());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact response body contains a valid float as a root value', async () => {
            const pactResponseBody = 1.1;

            const swaggerBodySchema = schemaBuilder.withTypeNumber().withFormatFloat();

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when the pact response body contains a string value', async () => {
            const pactResponseBody = {id: 'abc'};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatFloat());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: 'abc'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });

        it('should return the error when the pact response body contains a too large float value', async () => {
            const pactResponseBody = {id: 123.4567};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatFloat());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should pass "formatFloat" keyword validation',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: 123.4567
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '' +
                    '[root].paths./does/exist.get.responses.200.schema.properties.id.formatFloat',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });
    });

    describe('double parameters', () => {
        const swaggerPathWithDoubleParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withDoubleNamed('value'));

        it('should pass when the pact path contains a value that is a double', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDoubleParameter, '1234567890123456');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact path contains a value with decimals that is a double', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDoubleParameter, '001234567.8901234500');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when pact path contains a value that does not fit in a double', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDoubleParameter, '12345678901234567890');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /12345678901234567890',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/12345678901234567890'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithDoubleParameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains non-numeric double value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDoubleParameter, 'a');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET /a`,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/a`
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithDoubleParameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should return the error when a pact path contains blank double value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithDoubleParameter, ' ');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: GET / `,
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: `/ `
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithDoubleParameter.build()}
                },
                type: 'error'
            }]);
        });

        it('should pass when the pact response body contains a value that is a double', async () => {
            const pactResponseBody = {id: 1.1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatDouble());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact response body contains a double as a root value', async () => {
            const pactResponseBody = 1.1;

            const swaggerBodySchema = schemaBuilder.withTypeNumber().withFormatDouble();

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when the pact response body value is a string', async () => {
            const pactResponseBody = {id: 'abc'};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatDouble());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: 'abc'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });

        it('should pass when the pact response body contains a value that is so big precision is lost', async () => {
            // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
            const valueWherePrecisionIsLost = 12345678901234567890;
            const pactResponseBody = {id: valueWherePrecisionIsLost};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatDouble());

            const result = await invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });
    });

    describe('byte parameters', () => {
        const swaggerPathWithByteParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withByteNamed('value'));

        it('should pass when the pact path contains a value with base64 encoded data', async () => {
            const value = Buffer.from('base-64-encoded').toString('base64');

            const result = await invokeValidatorWithPath(swaggerPathWithByteParameter, value);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when pact path contains a value with 16 significant digits', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithByteParameter, 'not-base-64-encoded');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /not-base-64-encoded',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/not-base-64-encoded'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithByteParameter.build()}
                },
                type: 'error'
            }]);
        });
    });

    describe('binary parameters', () => {
        const swaggerPathWithBinaryParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withBinaryNamed('value'));

        it('should pass when the pact path contains a value with any sequence of octets', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithBinaryParameter, '123');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact path contains a value with only spaces', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithBinaryParameter, ' ');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when pact path contains a blank value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithBinaryParameter, '');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithBinaryParameter.build()}
                },
                type: 'error'
            }]);
        });
    });

    describe('password parameters', () => {
        const swaggerPathWithPasswordParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withPasswordNamed('value'));

        it('should pass when the pact path contains any value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithPasswordParameter, '123');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact path contains a value with only spaces', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithPasswordParameter, ' ');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when pact path contains a blank value', async () => {
            const result = await invokeValidatorWithPath(swaggerPathWithPasswordParameter, '');

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/{value}': swaggerPathWithPasswordParameter.build()}
                },
                type: 'error'
            }]);
        });
    });

    describe('unvalidated formats', () => {
        const formats = {
            'email': 'not-an-email',
            'hostname': '!not-a-hostname',
            'ipv4': 'not-an-ipv4-address',
            'ipv6': 'not-an-ipv6-address',
            'json-pointer': 'not-a-json-pointer',
            'regex': '(not-a-regex',
            'relative-json-pointer': 'not-a-relative-json-pointer',
            'time': 'not-a-time',
            'uri': 'not-a-uri',
            'uri-reference': 'not-a-uri-reference\n',
            'uri-template': 'not-a-uri-template\n',
            'url': 'not-a-url',
            'uuid': 'not-a-uuid',
            'S2S-Token': 'S2S-Token'
        };

        _.each(formats, (pactValue, formatName) => {
            it(`should pass when the pact path contains any value for ${formatName} parameters`, async () => {
                const swaggerPathWithFormatParameter = defaultSwaggerPathBuilder
                    .withParameter(pathParameterBuilder.withUnknownStringFormatNamed(formatName as string, 'value'));

                const result = await invokeValidatorWithPath(swaggerPathWithFormatParameter, pactValue);

                expect(result).toContainNoWarningsOrErrors();
            });
        });
    });

    describe('location', () => {
        it('should validate headers with formats', async () => {
            const tooBigInteger = (Math.pow(2, 31) + 1).toString();

            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(200)
                    .withResponseHeader('x-custom-header', tooBigInteger)
                )
                .build();

            const responseHeaderSpec = responseHeaderBuilder.withInt32();

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder
                        .withResponse(200, responseBuilder.withHeader('x-custom-header', responseHeaderSpec))
                    )
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.header.incompatible',
                message: 'Value is incompatible with the parameter defined in the spec file: ' +
                'should pass "formatInt32" keyword validation',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.headers.x-custom-header',
                    mockFile: 'pact.json',
                    value: tooBigInteger
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.responses.200.headers.x-custom-header',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: responseHeaderSpec.build()
                },
                type: 'error'
            }]);
        });

        it('should validate additional property schemas with formats', async () => {
            const tooBigInteger = Math.pow(2, 31) + 1;

            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(200)
                    .withResponseBody({value: tooBigInteger})
                )
                .build();

            const responseBodySchema = schemaBuilder
                .withTypeObject()
                .withAdditionalPropertiesSchema(schemaBuilder.withTypeInteger().withFormatInt32());

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder
                        .withResponse(200, responseBuilder.withSchema(responseBodySchema))
                    )
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should pass "formatInt32" keyword validation',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body[\'value\']',
                    mockFile: 'pact.json',
                    value: tooBigInteger
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location:
                        '[root].paths./does/exist.get.responses.200.schema.additionalProperties.formatInt32',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });

        it('should validate circular referenced schemas with formats', async () => {
            const tooBigInteger = Math.pow(2, 31) + 1;

            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(200)
                    .withResponseBody({id: tooBigInteger})
                )
                .build();

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder
                        .withResponse(200, responseBuilder.withSchema(
                            schemaBuilder.withReference('#/definitions/Response'))
                        )
                    )
                )
                .withDefinitions(definitionsBuilder
                    .withDefinition('Response', schemaBuilder
                        .withTypeObject()
                        .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt32())
                        .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
                    )
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should pass "formatInt32" keyword validation',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: tooBigInteger
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.responses.200.schema.properties.id.formatInt32',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });

        xit('should validate allOf schemas with formats', async () => {
            const tooBigInteger = Math.pow(2, 31) + 1;

            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(200)
                    .withResponseBody({id: tooBigInteger})
                )
                .build();

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder.withResponse(200, responseBuilder.withSchema(schemaBuilder
                        .withAllOf([
                            schemaBuilder
                                .withTypeObject()
                                .withOptionalProperty('id', schemaBuilder
                                    .withTypeInteger()
                                    .withFormatInt32()
                                )
                        ])
                    )))
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                'should pass "formatInt32" keyword validation',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: tooBigInteger
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.responses.200.schema.allOf.0.properties.id.formatInt32',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });

        it('should validate valid formats in array items for arrays as root schemas', async () => {
            const smallInteger = 101;
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withRequestBody([smallInteger])
                    .withResponseStatus(200)
                )
                .build();

            const requestBodySchema = schemaBuilder
                .withTypeArray(schemaBuilder.withTypeInteger().withFormatInt64());

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder
                        .withParameter(bodyParameterBuilder.withRequiredSchema(requestBodySchema))
                        .withResponse(200, responseBuilder)
                    )
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);
            expect(result).toContainNoWarningsOrErrors();
        });

        it('should validate invalid formats in array items for arrays as root schemas', async () => {
            const tooBigInteger = (Math.pow(2, 31) + 1);
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withRequestBody([tooBigInteger])
                    .withResponseStatus(200)
                )
                .build();

            const requestBodySchema = schemaBuilder
                .withTypeArray(schemaBuilder.withTypeInteger().withFormatInt32());

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder
                        .withParameter(bodyParameterBuilder.withRequiredSchema(requestBodySchema))
                        .withResponse(200, responseBuilder)
                    )
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'request.body.incompatible',
                message: 'Request body is incompatible with the request body schema in the spec file: ' +
                    'should pass "formatInt32" keyword validation',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.body[0]',
                    mockFile: 'pact.json',
                    value: tooBigInteger
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths./does/exist.get.parameters[0].schema.items.formatInt32',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });
    });
});
