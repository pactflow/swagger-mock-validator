import * as Decimal from 'decimal.js';
import {JsonSchema} from '../../types';

const maximumFloatPrecision = 6;

const isFloatFormat = (schema: JsonSchema) => schema.type === 'number' && schema.format as any === 'float';

export const floatAjvKeyword = 'formatFloat';

export const formatForFloatNumbers = (schema: JsonSchema) => {
    if (isFloatFormat(schema)) {
        delete schema.format;
        (schema as any)[floatAjvKeyword] = true;
    }
};

export const formatForFloatStrings = (schema: JsonSchema) => {
    if (isFloatFormat(schema)) {
        schema.type = 'string';
    }
};

export const isFloat = (rawValue: string|number) => {
    let value;

    try {
        value = new Decimal(rawValue);
    } catch (error) {
        return false;
    }

    return value.precision() <= maximumFloatPrecision;
};
