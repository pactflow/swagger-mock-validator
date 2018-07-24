import {JsonSchemaDefinitions} from '../../../../lib/swagger-mock-validator/types';
import {SchemaBuilder} from './schema-builder';

interface DefinitionsBuilderState {
    definitions: {
        [name: string]: SchemaBuilder;
    };
}

export class DefinitionsBuilder {
    public constructor(private readonly state: DefinitionsBuilderState) {}

    public build(): JsonSchemaDefinitions {
        return Object.keys(this.state.definitions).reduce<JsonSchemaDefinitions>((accumulator, definitionName) => {
            const schemaBuilder = this.state.definitions[definitionName];
            accumulator[definitionName] = schemaBuilder.build();
            return accumulator;
        }, {});
    }

    public withDefinition(name: string, schemaBuilder: SchemaBuilder): DefinitionsBuilder {
        const newDefinitions = {...this.state.definitions};
        newDefinitions[name] = schemaBuilder;
        return new DefinitionsBuilder({...this.state, definitions: newDefinitions});
    }
}

export const definitionsBuilder = new DefinitionsBuilder({definitions: {}});
