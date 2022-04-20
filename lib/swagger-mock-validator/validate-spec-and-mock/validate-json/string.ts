import { ParsedSpecJsonSchemaValue } from '../../spec-parser/parsed-spec';
import { isTypeSupported } from './is-type-supported';

export const stringAjvKeyword = 'regex';

const SwaggerAjvFormats = ['binary', 'byte', 'password', 'integer', 'date', 'date-time'];

export const formatForString = (schema: ParsedSpecJsonSchemaValue) => {
  if (
    isTypeSupported('string', schema.type) &&
    SwaggerAjvFormats.filter((element) => element === schema.format).length ===
      0
  ) {
    delete schema.format;
    (schema as any)[stringAjvKeyword] = true;
  }
};

export const isString = (rawValue: string) =>
  Object.prototype.toString.call(rawValue) === '[object String]';
