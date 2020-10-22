import {Decimal} from 'decimal.js';
import {ParsedSpecJsonSchemaValue} from '../../spec-parser/parsed-spec';
import {isTypeSupported} from './is-type-supported';

export const doubleAjvKeyword = 'formatDouble';

export const formatForDoubleNumbers = (schema: ParsedSpecJsonSchemaValue) => {
    if (isTypeSupported('number', schema.type) && schema.format as any === 'double') {
        delete schema.format;
        (schema as any)[doubleAjvKeyword] = true;
    }
};

export const isDouble = (rawValue: string | number) => {
    try {
        const fullPrecisionValue = new Decimal(rawValue);
        const doublePrecisionValue = new Decimal(fullPrecisionValue.toNumber());
        return fullPrecisionValue.eq(doublePrecisionValue);
    } catch (error) {
        return false;
    }
};
