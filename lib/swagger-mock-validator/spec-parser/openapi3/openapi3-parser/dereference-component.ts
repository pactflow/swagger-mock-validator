import * as jsonpointer from 'jsonpointer';
import {SwaggerMockValidatorErrorImpl} from '../../../swagger-mock-validator-error-impl';
import {Header, Openapi3Schema, Parameter, Reference, RequestBody, Response, SecurityScheme} from '../openapi3';

type OpenApi3Component = Parameter | RequestBody | Header | Response | SecurityScheme;

const isReference = (value: any): value is Reference => Boolean(value.$ref);

const toJsonPointer = (reference: string): string => reference.substring(1);

const checkForCircles = (ref: string, visitedReferences: string[]): void => {
    if (visitedReferences.indexOf(ref) >= 0) {
        throw new SwaggerMockValidatorErrorImpl(
            'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
            `Unable to resolve circular reference "${ref}"`
        );
    }
};

export const doDereferenceComponent = <T extends OpenApi3Component>(
    component: T | Reference,
    spec: Openapi3Schema,
    visitedReferences: string[]
): T => {
    if (isReference(component)) {
        const ref = component.$ref;
        checkForCircles(ref, visitedReferences);
        const pointer = toJsonPointer(ref);
        return doDereferenceComponent(jsonpointer.get(spec, pointer), spec, [...visitedReferences, ref]);
    }

    return component;
};

export const dereferenceComponent = <T extends OpenApi3Component>(component: T | Reference, spec: Openapi3Schema): T =>
    doDereferenceComponent(component, spec, []);
