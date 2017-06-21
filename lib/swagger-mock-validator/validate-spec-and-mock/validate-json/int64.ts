import * as _ from 'lodash';
import {JsonSchemaValue} from '../../types';

const int64MinValue = -Math.pow(2, 63);
const int64MaxValue = Math.pow(2, 63) - 1;

export const int64AjvKeyword = 'formatInt64';

export const formatForInt64Numbers = (schema: JsonSchemaValue) => {
    if (schema.type === 'integer' && schema.format as any === 'int64') {
        delete schema.format;
        (schema as any)[int64AjvKeyword] = true;
    }
};

export const isInt64 = (value: number) => _.isInteger(value) && value >= int64MinValue && value <= int64MaxValue;
