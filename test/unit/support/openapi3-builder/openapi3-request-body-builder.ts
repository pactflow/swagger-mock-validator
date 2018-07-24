import * as _ from 'lodash';
import {MediaType, RequestBody} from '../../../../lib/swagger-mock-validator/openapi3';

interface OpenApi3RequestBodyBuilderState {
    required: boolean;
    jsonContentSchema?: any;
}
interface ContentObject {
    [k: string]: MediaType;
}
export class OpenApi3RequestBodyBuilder {
    public static defaultOpenApi3OperationBuilder(): OpenApi3RequestBodyBuilder {
        return new OpenApi3RequestBodyBuilder({
            required: false
        });
    }

    private constructor(private readonly state: OpenApi3RequestBodyBuilderState) {}

    public withJsonContentSchema(jsonContentSchema: any) {
        const copyOfJsonContentSchema = _.cloneDeep(jsonContentSchema);
        return new OpenApi3RequestBodyBuilder(
            {...this.state, jsonContentSchema: copyOfJsonContentSchema}
        );
    }

    public build(): RequestBody {
        const content: ContentObject = {};
        if (this.state.jsonContentSchema) {
            content['application/json'] = {schema: _.cloneDeep(this.state.jsonContentSchema)};
        }

        return {
            content,
            required: this.state.required
        };
    }
}

export const openApi3RequestBodyBuilder = OpenApi3RequestBodyBuilder.defaultOpenApi3OperationBuilder();
