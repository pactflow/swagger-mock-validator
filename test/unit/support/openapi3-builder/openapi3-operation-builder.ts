import * as _ from 'lodash';
import {Operation} from '../../../../lib/swagger-mock-validator/openapi3';
import {OpenApi3RequestBodyBuilder} from './openapi3-request-body-builder';

interface OpenApi3OperationBuilderState {
    responses: object;
    requestBody?: OpenApi3RequestBodyBuilder;
}

export class OpenApi3OperationBuilder {
    public static defaultOpenApi3OperationBuilder(): OpenApi3OperationBuilder {
        return new OpenApi3OperationBuilder({
            responses: {
                200: {
                    description: 'default description'
                }
            }
        });
    }

    private constructor(private readonly state: OpenApi3OperationBuilderState) {}

    public withRequestBody(
        requestBody: OpenApi3RequestBodyBuilder
    ): OpenApi3OperationBuilder {
        return new OpenApi3OperationBuilder({...this.state, requestBody});
    }

    public withNoRequestBody(): OpenApi3OperationBuilder {
        return new OpenApi3OperationBuilder({...this.state, requestBody: undefined});
    }

    public build(): Operation {
        const operation: Operation = {
            responses: _.cloneDeep(this.state.responses)
        };

        return this.state.requestBody ? {...operation, requestBody: this.state.requestBody.build()} : operation;
    }
}

export const openApi3OperationBuilder = OpenApi3OperationBuilder.defaultOpenApi3OperationBuilder();
