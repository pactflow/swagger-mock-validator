"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonpointer = require("jsonpointer");
const swagger_mock_validator_error_impl_1 = require("../../../swagger-mock-validator-error-impl");
const isReference = (value) => Boolean(value.$ref);
const toJsonPointer = (reference) => reference.substring(1);
const checkForCircles = (ref, visitedReferences) => {
    if (visitedReferences.indexOf(ref) >= 0) {
        throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR', `Unable to resolve circular reference "${ref}"`);
    }
};
exports.doDereferenceComponent = (component, spec, visitedReferences) => {
    if (isReference(component)) {
        const ref = component.$ref;
        checkForCircles(ref, visitedReferences);
        const pointer = toJsonPointer(ref);
        return exports.doDereferenceComponent(jsonpointer.get(spec, pointer), spec, [...visitedReferences, ref]);
    }
    return component;
};
exports.dereferenceComponent = (component, spec) => exports.doDereferenceComponent(component, spec, []);
