import {PathItem} from '../../../../lib/swagger-mock-validator/openapi3';
import {OpenApi3OperationBuilder} from './openapi3-operation-builder';

interface Operations {
    [method: string]: OpenApi3OperationBuilder;
}

interface OpenApi3PathItemBuilderState {
    operations: Operations;
    description?: string;
}

type OpenApi3MethodName = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

export class OpenApi3PathItemBuilder {
    public static defaultOpenApi3PathItemBuilder(): OpenApi3PathItemBuilder {
        return new OpenApi3PathItemBuilder({
            operations: {}
        });
    }

    private constructor(private readonly state: OpenApi3PathItemBuilderState) {}

    public withOperation(
        operationName: OpenApi3MethodName,
        operationBuilder: OpenApi3OperationBuilder
    ): OpenApi3PathItemBuilder {
        const copyOfOperations = {...this.state.operations};
        copyOfOperations[operationName] = operationBuilder;
        return new OpenApi3PathItemBuilder({...this.state, operations: copyOfOperations});
    }

    public withNoOperations(): OpenApi3PathItemBuilder {
        return new OpenApi3PathItemBuilder({...this.state, operations: {}});
    }

    public build(): PathItem {
        return Object.keys(this.state.operations)
            .reduce<PathItem>((pathItem, currentMethod) => {
                pathItem[currentMethod] = this.state.operations[currentMethod].build();
                return pathItem;
            }, {});
    }
}

export const openApi3PathItemBuilder = OpenApi3PathItemBuilder.defaultOpenApi3PathItemBuilder();
