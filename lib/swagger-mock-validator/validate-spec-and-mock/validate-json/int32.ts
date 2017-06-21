import * as _ from 'lodash';
import {JsonSchemaValue} from '../../types';

const int32MinValue = -Math.pow(2, 31);
const int32MaxValue = Math.pow(2, 31) - 1;

export const int32AjvKeyword = 'formatInt32';

export const formatForInt32Numbers = (schema: JsonSchemaValue) => {
    if (schema.type === 'integer' && schema.format as any === 'int32') {
        delete schema.format;
        (schema as any)[int32AjvKeyword] = true;
    }
};

export const isInt32 = (value: number) => _.isInteger(value) && value >= int32MinValue && value <= int32MaxValue;
