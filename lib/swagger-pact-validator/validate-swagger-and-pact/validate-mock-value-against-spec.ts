import * as Ajv from 'ajv';
import * as _ from 'lodash';
import result from '../result';
import {JsonSchema, ParsedMockInteraction, ParsedMockValue, ParsedSpecValue} from '../types';

const toJsonSchema = (parameter: ParsedSpecValueWithType): JsonSchema => {
    const schema: JsonSchema = {
        properties: {
            value: {
                type: parameter.type as any
            }
        },
        type: 'object'
    };

    if (parameter.required) {
        schema.required = ['value'];
    }

    return schema;
};

const validateJson = (jsonSchema: JsonSchema, json: any) => {
    const ajv = new Ajv({
        allErrors: true,
        coerceTypes: true,
        verbose: true
    });

    ajv.validate(jsonSchema, json);

    return ajv.errors || [];
};

interface ParsedSpecValueWithType extends ParsedSpecValue<any> {
    required?: boolean;
    type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
}

export default <T>(
    name: string,
    swaggerValue: ParsedSpecValueWithType,
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
    const errors = validateJson(swaggerHeaderSchema, {value: (pactHeader || {value: undefined}).value});

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
