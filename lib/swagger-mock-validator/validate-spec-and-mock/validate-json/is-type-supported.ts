import {ParsedSpecJsonSchemaType} from '../../spec-parser/parsed-spec';

export const isTypeSupported = (
    typeToCheck: ParsedSpecJsonSchemaType,
    typesInSchema: ParsedSpecJsonSchemaType | ParsedSpecJsonSchemaType[] | undefined
): boolean =>
    Array.isArray(typesInSchema)
        ? typesInSchema.indexOf(typeToCheck) >= 0
        : typeToCheck === typesInSchema;
