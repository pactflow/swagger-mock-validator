import {isString} from 'util';

export const isOpenApi3Content = (specContent: any): boolean => {
    const openapiProperty = specContent.openapi;
    return isString(openapiProperty) && openapiProperty.indexOf('3.') === 0;
};
