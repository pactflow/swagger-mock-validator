import {Decimal} from 'decimal.js';
import {ParsedSpecJsonSchemaValue} from '../../spec-parser/parsed-spec';
import {isTypeSupported} from './is-type-supported';

const maximumFloatPrecision = 6;

export const floatAjvKeyword = 'formatFloat';

export const formatForFloatNumbers = (schema: ParsedSpecJsonSchemaValue) => {
    if (isTypeSupported('number', schema.type) && schema.format as any === 'float') {
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
