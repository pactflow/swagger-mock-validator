import * as _ from 'lodash';
import result from '../result';
import {
    JsonSchema,
    ParsedMockInteraction,
    ParsedMockValue,
    ParsedSpecParameter
} from '../types';
import validateJson from './validate-json';

const toJsonSchema = (parameter: ParsedSpecParameter): JsonSchema => {
    const schema: JsonSchema = {
        properties: {
            value: {
                enum: parameter.enum,
                exclusiveMaximum: parameter.exclusiveMaximum,
                exclusiveMinimum: parameter.exclusiveMinimum,
                format: parameter.format as any,
                maxLength: parameter.maxLength,
                maximum: parameter.maximum,
                minLength: parameter.minLength,
                minimum: parameter.minimum,
                type: parameter.type
            }
        },
        type: 'object'
    };

    if (parameter.required) {
        schema.required = ['value'];
    }

    return schema;
};

export default <T>(
    name: string,
    swaggerValue: ParsedSpecParameter,
    pactHeader: ParsedMockValue<T>,
    pactInteraction: ParsedMockInteraction
) => {
    if (swaggerValue.type === 'array') {
        return {
            match: true,
            results: [result.warning({
                message: `Validating parameters of type "${swaggerValue.type}" are not supported, ` +
                `assuming value is valid: ${name}`,
                pactSegment: pactHeader,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerValue
            })]
        };
    }

    const swaggerHeaderSchema = toJsonSchema(swaggerValue);
    const errors = validateJson(swaggerHeaderSchema, {value: (pactHeader || {value: undefined}).value}, true);

    return {
        match: errors.length === 0,
        results: _.map(errors, (error) => result.error({
            message: 'Value is incompatible with the parameter defined in the swagger file: ' +
            error.message,
            pactSegment: pactHeader || pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerValue
        }))
    };
};
