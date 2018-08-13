import {cloneDeep} from 'lodash';
import {Swagger2BodyParameter} from '../../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';
import {schemaBuilder, SchemaBuilder} from '../schema-builder';

const createBodyParameterBuilder = (parameter: Swagger2BodyParameter) => {
    return {
        build: () => cloneDeep(parameter),
        withOptionalSchema: (schema: SchemaBuilder) => createBodyParameterBuilder({
            in: 'body',
            name: 'body',
            required: false,
            schema: schema.build()
        }),
        withRequiredSchema: (schema: SchemaBuilder) => createBodyParameterBuilder({
            in: 'body',
            name: 'body',
            required: true,
            schema: schema.build()
        }),
        withRequiredSchemaReference: (referenceName: string) => createBodyParameterBuilder({
            in: 'body',
            name: 'body',
            required: true,
            schema: {
                $ref: referenceName
            }
        })
    };
};

export const bodyParameterBuilder = createBodyParameterBuilder(undefined as any).withOptionalSchema(schemaBuilder);
