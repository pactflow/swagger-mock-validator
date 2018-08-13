export interface Pact {
    consumer: { name: string };
    interactions: PactInteraction[];
    metadata: { pactSpecificationVersion: string };
    provider: { name: string };
}

export interface PactInteraction {
    description: string;
    request: PactInteractionRequest;
    response: PactInteractionResponse;
    providerState?: string;
    provider_state?: string;
}

export interface PactInteractionRequest {
    headers?: PactInteractionHeaders;
    body?: any;
    method: string;
    path: string;
    query?: string;
}

export interface PactInteractionResponse {
    body?: any;
    headers?: PactInteractionHeaders;
    status: number;
}

export interface PactInteractionHeaders {
    [headerName: string]: string;
}
