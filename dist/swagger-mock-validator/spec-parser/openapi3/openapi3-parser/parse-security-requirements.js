"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dereference_component_1 = require("./dereference-component");
const dereferenceSecuritySchemes = (securitySchemes, spec) => Object.keys(securitySchemes)
    .reduce((dereferencedSchemes, schemeName) => {
    dereferencedSchemes[schemeName] = dereference_component_1.dereferenceComponent(securitySchemes[schemeName], spec);
    return dereferencedSchemes;
}, {});
const getCredentialLocation = (securityScheme) => securityScheme.type === 'apiKey' ? securityScheme.in : 'header';
const getCredentialKey = (securityScheme) => securityScheme.type === 'apiKey' ? securityScheme.name : 'authorization';
const getCredential = (requirementDefinition) => isSupportedRequirementDefinition(requirementDefinition)
    ? {
        credentialKey: getCredentialKey(requirementDefinition.scheme),
        credentialLocation: getCredentialLocation(requirementDefinition.scheme)
    }
    : {
        credentialKey: 'unknown',
        credentialLocation: 'unsupported'
    };
const toParsedSpecSecurityRequirement = (requirementDefinition, baseLocation, parentOperation) => (Object.assign({}, getCredential(requirementDefinition), { location: `${baseLocation}.${requirementDefinition.name}`, parentOperation, value: requirementDefinition.value }));
const isApiKeySecuritySchemeInHeaderOrQuery = (scheme) => scheme.type === 'apiKey' && (scheme.in === 'header' || scheme.in === 'query');
const isHttpSecurityScheme = (scheme) => scheme.type === 'http';
const isSupportedRequirementDefinition = (requirement) => isApiKeySecuritySchemeInHeaderOrQuery(requirement.scheme) || isHttpSecurityScheme(requirement.scheme);
const toRequirementDefinition = (name, securitySchemes, securityRequirement) => ({ name, scheme: securitySchemes[name], value: securityRequirement[name] });
const parseSecurityRequirementGroup = (securityRequirement, securitySchemes, baseLocation, parentOperation) => Object.keys(securityRequirement)
    .map((securityRequirementName) => toRequirementDefinition(securityRequirementName, securitySchemes, securityRequirement))
    .map((requirementDefinition) => toParsedSpecSecurityRequirement(requirementDefinition, baseLocation, parentOperation));
const parseAllSecurityRequirements = (securityRequirementsAndBaseLocation, securitySchemes, parentOperation) => securityRequirementsAndBaseLocation.securityRequirements
    .map((securityRequirement, index) => parseSecurityRequirementGroup(securityRequirement, securitySchemes, `${securityRequirementsAndBaseLocation.location}[${index}]`, parentOperation))
    .filter((securityRequirementGroup) => securityRequirementGroup.length > 0);
const getSecuritySchemes = (spec) => {
    if (spec.components && spec.components.securitySchemes) {
        return dereferenceSecuritySchemes(spec.components.securitySchemes, spec);
    }
    return {};
};
const getSecurityRequirementsAndBaseLocation = (parentOperation, globalSecurityRequirements, operationSecurityRequirements) => {
    if (operationSecurityRequirements) {
        return { location: `${parentOperation.location}.security`, securityRequirements: operationSecurityRequirements };
    }
    else if (globalSecurityRequirements) {
        return { location: '[root].security', securityRequirements: globalSecurityRequirements };
    }
    return undefined;
};
exports.parseSecurityRequirements = (globalSecurityRequirements, operationSecurityRequirements, parentOperation, spec) => {
    const securityRequirementsAndBaseLocation = getSecurityRequirementsAndBaseLocation(parentOperation, globalSecurityRequirements, operationSecurityRequirements);
    return securityRequirementsAndBaseLocation
        ? parseAllSecurityRequirements(securityRequirementsAndBaseLocation, getSecuritySchemes(spec), parentOperation)
        : [];
};
