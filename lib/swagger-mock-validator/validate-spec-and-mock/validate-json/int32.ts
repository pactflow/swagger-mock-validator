import {Decimal} from 'decimal.js';
import {ParsedSpecJsonSchemaValue} from '../../spec-parser/parsed-spec';

const int32MinValue = Decimal.pow(2, 31).negated();
const int32MaxValue = Decimal.pow(2, 31).minus(1);

export const int32AjvKeyword = 'formatInt32';

export const formatForInt32Numbers = (schema: ParsedSpecJsonSchemaValue) => {
    if (schema.type === 'integer' && schema.format as any === 'int32') {
        delete schema.format;
        (schema as any)[int32AjvKeyword] = true;
    }
};

export const isInt32 = (rawValue: number | string) => {
    try {
        const value = new Decimal(rawValue);
        return value.isInteger() && value.greaterThanOrEqualTo(int32MinValue) && value.lessThanOrEqualTo(int32MaxValue);
    } catch (error) {
        return false;
    }
};
