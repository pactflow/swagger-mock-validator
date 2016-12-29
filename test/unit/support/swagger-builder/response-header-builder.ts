import {cloneDeep} from 'lodash';
import {SwaggerResponseHeader} from '../../../../lib/swagger-pact-validator/types';

export interface ResponseHeaderBuilder {
    build: () => SwaggerResponseHeader;
}

const createResponseHeader = (responseHeader: SwaggerResponseHeader) => ({
    build: () => cloneDeep(responseHeader),
    withStringEnum: (newEnum: any[]) => createResponseHeader({
        enum: newEnum,
        type: 'string'
    }),
    withTypeArrayOfNumber: () => createResponseHeader({
        items: {type: 'number'},
        type: 'array'
    }),
    withTypeDate: () => createResponseHeader({
        format: 'date',
        type: 'string'
    }),
    withTypeNumber: () => createResponseHeader({type: 'number'}),
    withTypeString: () => createResponseHeader({type: 'string'})
});

export default createResponseHeader(null).withTypeString();
