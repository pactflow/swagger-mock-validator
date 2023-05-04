import _ from 'lodash';
import {Swagger2JsonSchemaDefinitions} from '../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';
import {setValueOn} from '../builder-utilities';
import {SchemaBuilder} from './schema-builder';

export interface DefinitionsBuilder {
    build: () => Swagger2JsonSchemaDefinitions;
}

const createDefinitionsBuilder = (definitions: Swagger2JsonSchemaDefinitions) => ({
    build: () => _.cloneDeep(definitions),
    withDefinition: (name: string, schemaBuilder: SchemaBuilder) =>
        createDefinitionsBuilder(setValueOn(definitions, name, schemaBuilder.build()))
});

export const definitionsBuilder = createDefinitionsBuilder({});
