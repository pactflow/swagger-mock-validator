import Ajv  from 'ajv/dist/2019';
import addFormats from "ajv-formats"
import {ParsedSpecJsonSchema} from '../spec-parser/parsed-spec';

export const validateJson = (jsonSchema: ParsedSpecJsonSchema, json: any, numbersSentAsStrings?: boolean) => {
    const ajv = new Ajv({
        allErrors: true,
        coerceTypes: numbersSentAsStrings || false,
        discriminator: true,
        logger: false,
        strictSchema: false,
    });
    addFormats(ajv);
    ajv.addKeyword({
        keyword: 'collectionFormat',
        type: 'array',
    });

    ajv.validate(jsonSchema, json);

    return ajv.errors || [];
};
