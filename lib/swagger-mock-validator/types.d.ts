import {SwaggerMockValidatorOptionsMockType, SwaggerMockValidatorOptionsSpecType, ValidationResult} from '../api-types';

export interface PactBrokerRootResponse {
    _links: PactBrokerLinks;
}

interface PactBrokerLinks {
    'pb:pacticipant': PactBrokerLinksPacticipant;
    'pb:latest-provider-pacts': PactBrokerLinksLatestProviderPacts;
    'pb:latest-provider-pacts-with-tag': PactBrokerLinksLatestProviderPacts;
    'pb:pacticipant-version-tag': PactBrokerLinksPacticipantVersionTag;
    'pb:pacticipant-branch-version': PactBrokerLinksPacticipantBranchVersion;
}

interface PactBrokerLinksPacticipant {
    href: string;
}
interface PactBrokerLinksPacticipantVersionTag {
    href: string;
}
interface PactBrokerLinksPacticipantBranchVersion {
    href: string;
}
interface PactBrokerLinksLatestProviderPacts {
    href: string;
}

export interface PactBrokerProviderPacts {
    _links: PactBrokerProviderPactsLinks;
}

interface PactBrokerProviderPactsLinks {
    pacts: PactBrokerProviderPactsLinksPact[];
}

export interface PactBrokerProviderPactsLinksPact {
    href: string;
}

export interface SwaggerMockValidatorUserOptions {
    analyticsUrl?: string;
    mockPathOrUrl: string;
    providerName?: string;
    specPathOrUrl: string;
    tag?: string;
    additionalPropertiesInResponse?: string;
    requiredPropertiesInResponse?: string;
    providerApplicationVersion?: string;
    buildUrl?: string;
    publish?: string;
    providerBranch?: string;
    providerTags?: string;
}

export interface PactBrokerUserOptions {
    pactBrokerUrl: string;
    providerName: string;
    tag?: string;
}

export type PactBrokerUserOptionsWithTag = PactBrokerUserOptions & {
    tag: string;
};

export type AutoDetectFormat = 'auto-detect';

export interface SerializedSpec {
    content: string;
    format: SwaggerMockValidatorOptionsSpecType | AutoDetectFormat;
    pathOrUrl: string;
}

export interface SerializedMock {
    content: string;
    format: SwaggerMockValidatorOptionsMockType | AutoDetectFormat;
    pathOrUrl: string;
}

export interface ValidateOptions {
    mock: SerializedMock;
    spec: SerializedSpec;
    additionalPropertiesInResponse: boolean;
    requiredPropertiesInResponse: boolean;
}

interface ParsedSwaggerMockValidatorOptions {
    analyticsUrl?: string;
    mockPathOrUrl: string;
    mockSource: MockSource;
    providerName?: string;
    specPathOrUrl: string;
    specSource: SpecSource;
    tag?: string;
    additionalPropertiesInResponse: boolean;
    requiredPropertiesInResponse: boolean;
    providerApplicationVersion?: string;
    providerBranch?: string;
    providerTags?: string;
    buildUrl?: string;
    publish: boolean;
}

export type MockSource = 'pactBroker' | 'path' | 'url';

export type SpecSource = 'path' | 'url';

export interface GetSwaggerValueSuccessResult<T> {
    found: true;
    results: ValidationResult[];
    value: T;
}

export interface GetSwaggerValueFailedResult {
    found: false;
    results: ValidationResult[];
}

export type GetSwaggerValueResult<T> = GetSwaggerValueSuccessResult<T> | GetSwaggerValueFailedResult;

export type MultiCollectionFormatSeparator = '[multi-array-separator]';
