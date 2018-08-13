import {Decimal} from 'decimal.js';
import {ParsedSpecJsonSchemaValue} from '../../spec-parser/parsed-spec';

const maximumFloatPrecision = 6;

export const floatAjvKeyword = 'formatFloat';

export const formatForFloatNumbers = (schema: ParsedSpecJsonSchemaValue) => {
    if (schema.type === 'number' && schema.format as any === 'float') {
        delete schema.format;
        (schema as any)[floatAjvKeyword] = true;
    }
};

export const isFloat = (rawValue: number | string) => {
    try {
        return new Decimal(rawValue).precision() <= maximumFloatPrecision;
    } catch (error) {
        return false;
    }
};
