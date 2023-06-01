interface PactMetadata {
    pactSpecification?: {
        version?: string;
    };
    pactSpecificationVersion?: string;
    'pact-specification'?: {
        version?: string;
    };
}
export interface Pact {
    consumer: { name: string };
    interactions: PactInteraction[];
    metadata?: PactMetadata;
    metaData?: PactMetadata;
    provider: { name: string };
}

export interface PactInteraction {
    type?: string;
    description: string;
    request: PactInteractionRequest;
    response: PactInteractionResponse;
    providerState?: string;
    provider_state?: string;
}

export type PactV1RequestQuery = string;
export type PactV3RequestQuery = { [name: string]: string[] };

export interface PactInteractionRequest {
    headers?: PactInteractionHeaders;
    body?: any;
    method: string;
    path: string;
    query?: PactV1RequestQuery | PactV3RequestQuery;
}

export interface PactInteractionResponse {
    body?: any;
    headers?: PactInteractionHeaders;
    status: number;
}

export interface PactInteractionHeaders {
    [headerName: string]: string;
}
