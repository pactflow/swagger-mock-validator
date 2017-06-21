import * as Decimal from 'decimal.js';
import {JsonSchemaValue} from '../../types';

const maximumFloatPrecision = 6;

export const floatAjvKeyword = 'formatFloat';

export const formatForFloatNumbers = (schema: JsonSchemaValue) => {
    if (schema.type === 'number' && schema.format as any === 'float') {
        delete schema.format;
        (schema as any)[floatAjvKeyword] = true;
    }
};

export const isFloat = (value: number) => new Decimal(value).precision() <= maximumFloatPrecision;
