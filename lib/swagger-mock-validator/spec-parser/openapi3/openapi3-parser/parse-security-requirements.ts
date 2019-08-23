import {
    ParsedSpecCredentialLocation,
    ParsedSpecOperation,
    ParsedSpecSecurityRequirement,
    ParsedSpecSecurityRequirementCredential,
    ParsedSpecSecurityRequirements
} from '../../parsed-spec';
import {
    ApiKeySecurityScheme,
    HttpSecurityScheme,
    Openapi3Schema,
    Reference,
    SecurityRequirement,
    SecurityScheme
} from '../openapi3';
import {dereferenceComponent} from './dereference-component';

interface SecuritySchemes {
    [k: string]: SecurityScheme | Reference;
}

interface DereferencedSecuritySchemes {
    [k: string]: SecurityScheme;
}

interface SecurityRequirementsAndBaseLocation {
    location: string;
    securityRequirements: SecurityRequirement[];
}

interface RequirementDefinition {
    scheme: SecurityScheme;
    name: string;
    value: string[];
}

interface ApiKeySecuritySchemeInHeaderOrQuery extends ApiKeySecurityScheme {
    in: 'header' | 'query';
}

type SupportedSecurityScheme = ApiKeySecuritySchemeInHeaderOrQuery | HttpSecurityScheme;

interface SupportedRequirementDefinition extends RequirementDefinition {
    scheme: SupportedSecurityScheme;
}

const dereferenceSecuritySchemes = (
    securitySchemes: SecuritySchemes, spec: Openapi3Schema
): DereferencedSecuritySchemes =>
    Object.keys(securitySchemes)
        .reduce((dereferencedSchemes: DereferencedSecuritySchemes, schemeName) => {
            dereferencedSchemes[schemeName] = dereferenceComponent(securitySchemes[schemeName], spec);
            return dereferencedSchemes;
        }, {});

const getCredentialLocation = (securityScheme: SupportedSecurityScheme): ParsedSpecCredentialLocation =>
    securityScheme.type === 'apiKey' ? securityScheme.in : 'header';

const getCredentialKey = (securityScheme: SecurityScheme): string =>
    securityScheme.type === 'apiKey' ? securityScheme.name : 'authorization';

const getCredential = (requirementDefinition: RequirementDefinition): ParsedSpecSecurityRequirementCredential =>
    isSupportedRequirementDefinition(requirementDefinition)
        ? {
            credentialKey: getCredentialKey(requirementDefinition.scheme),
            credentialLocation: getCredentialLocation(requirementDefinition.scheme)
        }
        : {
            credentialKey: 'unknown',
            credentialLocation: 'unsupported'
        };

const toParsedSpecSecurityRequirement = (
    requirementDefinition: RequirementDefinition,
    baseLocation: string,
    parentOperation: ParsedSpecOperation
): ParsedSpecSecurityRequirement => (
    {
        ...getCredential(requirementDefinition),
        location: `${baseLocation}.${requirementDefinition.name}`,
        parentOperation,
        value: requirementDefinition.value
    }
);

const isApiKeySecuritySchemeInHeaderOrQuery = (
    scheme: SecurityScheme
): scheme is ApiKeySecuritySchemeInHeaderOrQuery =>
    scheme.type === 'apiKey' && (scheme.in === 'header' || scheme.in === 'query');

const isHttpSecurityScheme = (scheme: SecurityScheme): scheme is HttpSecurityScheme =>
    scheme.type === 'http';

const isSupportedRequirementDefinition = (
    requirement: RequirementDefinition
): requirement is SupportedRequirementDefinition =>
    isApiKeySecuritySchemeInHeaderOrQuery(requirement.scheme) || isHttpSecurityScheme(requirement.scheme);

const toRequirementDefinition = (
    name: string,
    securitySchemes: DereferencedSecuritySchemes,
    securityRequirement: SecurityRequirement
): RequirementDefinition => ({name, scheme: securitySchemes[name], value: securityRequirement[name]});

const parseSecurityRequirementGroup = (
    securityRequirement: SecurityRequirement,
    securitySchemes: DereferencedSecuritySchemes,
    baseLocation: string,
    parentOperation: ParsedSpecOperation
): ParsedSpecSecurityRequirements =>

    Object.keys(securityRequirement)
        .map((securityRequirementName) =>
            toRequirementDefinition(securityRequirementName, securitySchemes, securityRequirement))
        .map((requirementDefinition): ParsedSpecSecurityRequirement =>
            toParsedSpecSecurityRequirement(requirementDefinition, baseLocation, parentOperation));

const parseAllSecurityRequirements = (
    securityRequirementsAndBaseLocation: SecurityRequirementsAndBaseLocation,
    securitySchemes: DereferencedSecuritySchemes,
    parentOperation: ParsedSpecOperation
): ParsedSpecSecurityRequirements[] =>

    securityRequirementsAndBaseLocation.securityRequirements
        .map((securityRequirement, index) =>
            parseSecurityRequirementGroup(
                securityRequirement,
                securitySchemes,
                `${securityRequirementsAndBaseLocation.location}[${index}]`,
                parentOperation
            ))
        .filter((securityRequirementGroup) => securityRequirementGroup.length > 0);

const getSecuritySchemes = (spec: Openapi3Schema): DereferencedSecuritySchemes => {
    if (spec.components && spec.components.securitySchemes) {
        return dereferenceSecuritySchemes(spec.components.securitySchemes, spec);
    }
    return {};
};

const getSecurityRequirementsAndBaseLocation = (
    parentOperation: ParsedSpecOperation,
    globalSecurityRequirements: SecurityRequirement[] | undefined,
    operationSecurityRequirements: SecurityRequirement[] | undefined
): SecurityRequirementsAndBaseLocation | undefined => {
    if (operationSecurityRequirements) {
        return {location: `${parentOperation.location}.security`, securityRequirements: operationSecurityRequirements};
    } else if (globalSecurityRequirements) {
        return {location: '[root].security', securityRequirements: globalSecurityRequirements};
    }
    return undefined;
};

export const parseSecurityRequirements = (
    globalSecurityRequirements: SecurityRequirement[] | undefined,
    operationSecurityRequirements: SecurityRequirement[] | undefined,
    parentOperation: ParsedSpecOperation,
    spec: Openapi3Schema
): ParsedSpecSecurityRequirements[] => {
    const securityRequirementsAndBaseLocation = getSecurityRequirementsAndBaseLocation(
        parentOperation, globalSecurityRequirements, operationSecurityRequirements
    );
    return securityRequirementsAndBaseLocation
        ? parseAllSecurityRequirements(securityRequirementsAndBaseLocation, getSecuritySchemes(spec), parentOperation)
        : [];
};
