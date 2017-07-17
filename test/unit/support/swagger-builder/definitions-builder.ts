import * as _ from 'lodash';
import {JsonSchemaDefinitions} from '../../../../lib/swagger-mock-validator/types';
import {setValueOn} from '../builder-utilities';
import {SchemaBuilder} from './schema-builder';

export interface DefinitionsBuilder {
    build: () => JsonSchemaDefinitions;
}

const createDefinitionsBuilder = (definitions: JsonSchemaDefinitions) => ({
    build: () => _.cloneDeep(definitions),
    withDefinition: (name: string, schemaBuilder: SchemaBuilder) =>
        createDefinitionsBuilder(setValueOn(definitions, name, schemaBuilder.build()))
});

export default createDefinitionsBuilder({});
