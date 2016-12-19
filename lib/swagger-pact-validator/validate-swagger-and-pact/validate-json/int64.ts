import * as Decimal from 'decimal.js';
import {JsonSchema} from '../../types';

const int64MinValue = new Decimal('-9223372036854775808');
const int64MaxValue = new Decimal('9223372036854775807');

const isInt64Format = (schema: JsonSchema) => schema.type === 'integer' && schema.format as any === 'int64';

export const int64AjvKeyword = 'formatInt64';

export const formatForInt64Numbers = (schema: JsonSchema) => {
    if (isInt64Format(schema)) {
        delete schema.format;
        (schema as any)[int64AjvKeyword] = true;
    }
};

export const formatForInt64Strings = (schema: JsonSchema) => {
    if (isInt64Format(schema)) {
        schema.type = 'string';
    }
};

export const isInt64 = (rawValue: string|number) => {
    let value;

    try {
        value = new Decimal(rawValue);
    } catch (error) {
        return false;
    }

    return value.isInteger() && value.greaterThanOrEqualTo(int64MinValue) && value.lessThanOrEqualTo(int64MaxValue);
};
