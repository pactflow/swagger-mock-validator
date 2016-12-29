import * as Decimal from 'decimal.js';
import {JsonSchema} from '../../types';

const maximumDoublePrecision = 15;

export const doubleAjvKeyword = 'formatDouble';

export const formatForDoubleNumbers = (schema: JsonSchema) => {
    if (schema.type === 'number' && schema.format as any === 'double') {
        delete schema.format;
        (schema as any)[doubleAjvKeyword] = true;
    }
};

export const isDouble = (value: number) => new Decimal(value).precision() <= maximumDoublePrecision;
