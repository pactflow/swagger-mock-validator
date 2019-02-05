import {createEmptyParentOperation} from '../common/create-empty-parent-operation';
import {ParsedSpec, ParsedSpecOperation} from '../parsed-spec';
import {HttpMethod, Openapi3Schema, PathItem} from './openapi3';
import {parseOperation} from './openapi3-parser/parse-operation';

const typeSafeHttpMethods: {[method in HttpMethod]: null } = {
    delete: null, get: null, head: null, options: null, patch: null, post: null, put: null, trace: null
};

const supportedHttpMethods = Object.keys(typeSafeHttpMethods);

const isHttpMethod = (value: string): boolean =>
    supportedHttpMethods.indexOf(value) >= 0;

const getPathHttpMethodNames = (pathItem: PathItem): string[] =>
    Object.keys(pathItem).filter(isHttpMethod);

const parsePathOperations = (
    pathName: string, specJson: Openapi3Schema, rootLocation: string, specPathOrUrl: string
): ParsedSpecOperation[] => {
    const path = specJson.paths[pathName];
    return getPathHttpMethodNames(path)
        .map((pathHttpMethod) => {
            const pathLocation = `${rootLocation}.paths.${pathName}`;
            return parseOperation({
                operation: path[pathHttpMethod],
                operationLocation: `${pathLocation}.${pathHttpMethod}`,
                operationName: pathHttpMethod,
                pathItemParameters: path.parameters,
                pathLocation,
                pathName,
                spec: specJson,
                specPathOrUrl
            });
        });
};

const parseOperations = (
    specJson: Openapi3Schema, rootLocation: string, specPathOrUrl: string
): ParsedSpecOperation[] => {
    return Object.keys(specJson.paths)
        .map((pathName) => parsePathOperations(pathName, specJson, rootLocation, specPathOrUrl))
        .reduce<ParsedSpecOperation[]>((accumulator, nextOperations) => [...accumulator, ...nextOperations], []);
};

export const openApi3Parser = {
    parse: (specJson: Openapi3Schema, specPathOrUrl: string): ParsedSpec => {
        const rootLocation = '[root]';
        return {
            operations: parseOperations(specJson, rootLocation, specPathOrUrl),
            pathOrUrl: specPathOrUrl,
            paths: {
                location: `${rootLocation}.paths`,
                parentOperation: createEmptyParentOperation(specPathOrUrl),
                value: specJson.paths
            }
        };
    }
};
