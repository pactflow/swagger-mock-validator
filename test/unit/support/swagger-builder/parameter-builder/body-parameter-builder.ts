import {cloneDeep} from 'lodash';
import {SwaggerBodyParameter} from '../../../../../lib/swagger-mock-validator/types';
import {default as schemaBuilder, SchemaBuilder} from '../schema-builder';

const createBodyParameterBuilder = (parameter: SwaggerBodyParameter) => {
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
        })
    };
};

export const bodyParameterBuilder = createBodyParameterBuilder(undefined as any).withOptionalSchema(schemaBuilder);
