import {ValidationResult} from '../api-types';

export interface PactBroker {
    _links: PactBrokerLinks;
}

interface PactBrokerLinks {
    'pb:latest-provider-pacts': PactBrokerLinksLatestProviderPacts;
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

export interface SwaggerMockValidatorInternalOptions {
    analyticsUrl?: string;
    mockPathOrUrl: string;
    providerName?: string;
    specPathOrUrl: string;
}

interface ParsedSwaggerMockValidatorOptions {
    analyticsUrl?: string;
    mockPathOrUrl: string;
    mockSource: MockSource;
    providerName?: string;
    specPathOrUrl: string;
    specSource: SpecSource;
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
