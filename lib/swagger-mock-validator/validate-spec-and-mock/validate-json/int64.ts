import {Decimal} from 'decimal.js';
import {JsonSchemaValue} from '../../types';

const int64MinValue = Decimal.pow(2, 63).negated();
const int64MaxValue = Decimal.pow(2, 63).minus(1);

export const int64AjvKeyword = 'formatInt64';

export const formatForInt64Numbers = (schema: JsonSchemaValue) => {
    if (schema.type === 'integer' && schema.format as any === 'int64') {
        delete schema.format;
        (schema as any)[int64AjvKeyword] = true;
    }
};

export const isInt64 = (parsedValue: number | string) => {
    try {
        const value = new Decimal(parsedValue);
        return value.isInteger() && value.greaterThanOrEqualTo(int64MinValue) && value.lessThanOrEqualTo(int64MaxValue);
    } catch (error) {
        return false;
    }
};
