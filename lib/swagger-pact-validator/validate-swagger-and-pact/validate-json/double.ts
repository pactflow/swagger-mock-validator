import * as Decimal from 'decimal.js';
import {JsonSchema} from '../../types';

const maximumDoublePrecision = 15;

const isDoubleFormat = (schema: JsonSchema) => schema.type === 'number' && schema.format as any === 'double';

export const doubleAjvKeyword = 'formatDouble';

export const formatForDoubleNumbers = (schema: JsonSchema) => {
    if (isDoubleFormat(schema)) {
        delete schema.format;
        (schema as any)[doubleAjvKeyword] = true;
    }
};

export const formatForDoubleStrings = (schema: JsonSchema) => {
    if (isDoubleFormat(schema)) {
        schema.type = 'string';
    }
};

export const isDouble = (rawValue: string|number) => {
    let value;

    try {
        value = new Decimal(rawValue);
    } catch (error) {
        return false;
    }

    return value.precision() <= maximumDoublePrecision;
};
