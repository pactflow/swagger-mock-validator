import {cloneDeep} from 'lodash';
import {RequestBody} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {setValueOn} from '../builder-utilities';
import {OpenApi3ContentBuilder} from './openapi3-content-builder';

export interface OpenApi3RequestBodyBuilder {
    build: () => RequestBody;
}

const createOpenApi3RequestBodyBuilder = (openApi3RequestBody: RequestBody) => ({
    build: () => cloneDeep(openApi3RequestBody),
    withContent: (contentBuilder: OpenApi3ContentBuilder) =>
        createOpenApi3RequestBodyBuilder(
            setValueOn(openApi3RequestBody, 'content', contentBuilder.build())
        ),
    withRequiredBody: () =>
        createOpenApi3RequestBodyBuilder(
            setValueOn(openApi3RequestBody, 'required', true)
        )
});

export const openApi3RequestBodyBuilder = createOpenApi3RequestBodyBuilder({content: {}});
