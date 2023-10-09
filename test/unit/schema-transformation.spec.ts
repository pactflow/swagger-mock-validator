import { transformSchema } from '../../lib/swagger-mock-validator/validate-spec-and-mock/validate-parsed-mock-response-body';

// defaults
const options = {
    additionalPropertiesInResponse: false,
    requiredPropertiesInResponse: false,
};

const transformedAdditionalProps = (schema) => transformSchema(schema, options).additionalProperties;
const transformedRequired = (schema) => transformSchema(schema, options).required;

describe('response transformation', () => {
    // a provider must provide a superset of what the consumer asks for
    // additionalProperties expected in pact response are disallowed
    describe('additionalProperties', () => {
        it('is prevented in objects', () => {
            expect(transformedAdditionalProps({ type: 'object' })).toBeFalse();
        });

        it('is forced to be false', () => {
            expect(transformedAdditionalProps({ type: 'object', additionalProperties: true })).toBeFalse();
        });

        it('allows schema composition', () => {
            expect(transformedAdditionalProps({ type: 'object', oneOf: [] })).toBeUndefined();
            expect(transformedAdditionalProps({ type: 'object', allOf: [] })).toBeUndefined();
            expect(transformedAdditionalProps({ type: 'object', anyOf: [] })).toBeUndefined();
        });
    });

    // a consumer may only use a subset of the provider *response*
    // any field marked as required in OAS, should be considered optional for pact testing
    describe('required properties', () => {
        it('makes properties optional', () => {
            expect(
                transformedRequired({
                    type: 'object',
                    required: ['foo'],
                    properties: {
                        foo: {
                            type: 'string',
                        },
                    },
                })
            ).toBeUndefined();
        });
    });
});
