import {cloneDeep} from 'lodash';
import {SwaggerResponseHeader} from '../../../../lib/swagger-pact-validator/types';
import {setValueOn, setValuesOn} from '../builder-utilities';

export interface ResponseHeaderBuilder {
    build: () => SwaggerResponseHeader;
}

const createResponseHeader = (responseHeader: SwaggerResponseHeader) => ({
    build: () => cloneDeep(responseHeader),
    withTypeArrayOfNumber: () => createResponseHeader(setValuesOn(responseHeader, {
        items: {type: 'number'},
        type: 'array'
    })),
    withTypeDate: () => createResponseHeader(setValuesOn(responseHeader, {
        format: 'date',
        type: 'string'
    })),
    withTypeNumber: () => createResponseHeader(setValueOn(responseHeader, 'type', 'number'))
});

export default createResponseHeader({type: 'string'});
