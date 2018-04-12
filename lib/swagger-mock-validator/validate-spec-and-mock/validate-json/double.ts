import {Decimal} from 'decimal.js';
import {JsonSchemaValue} from '../../types';

export const doubleAjvKeyword = 'formatDouble';

export const formatForDoubleNumbers = (schema: JsonSchemaValue) => {
    if (schema.type === 'number' && schema.format as any === 'double') {
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
