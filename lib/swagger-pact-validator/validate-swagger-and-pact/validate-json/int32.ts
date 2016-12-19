import * as _ from 'lodash';
import {JsonSchema} from '../../types';

const int32MinValue = -2147483648;
const int32MaxValue = 2147483647;

const isInt32Format = (schema: JsonSchema) => schema.type === 'integer' && schema.format as any === 'int32';

export const int32AjvKeyword = 'formatInt32';

export const formatForInt32Numbers = (schema: JsonSchema) => {
    if (isInt32Format(schema)) {
        delete schema.format;
        (schema as any)[int32AjvKeyword] = true;
    }
};

export const formatForInt32Strings = (schema: JsonSchema) => {
    if (isInt32Format(schema)) {
        schema.type = 'string';
    }
};

export const isInt32 = (rawValue: string|number) => {
    const value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;

    return _.isInteger(value) && value >= int32MinValue && value <= int32MaxValue;
};
