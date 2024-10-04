import _ from 'lodash';
import {PactBrokerClient} from './clients/pact-broker-client';
import {SwaggerMockValidatorErrorImpl} from './swagger-mock-validator-error-impl';
import {
    PactBrokerProviderPacts,
    PactBrokerProviderPactsLinksPact,
    PactBrokerRootResponse,
    PactBrokerUserOptions,
    PactBrokerUserOptionsWithTag,
    PactBrokerUserOptionsWithBranch,
    SerializedMock
} from './types';

export class PactBroker {
    private static getProviderTemplateUrl(pactBrokerRootResponse: PactBrokerRootResponse, template: string): string {
        return _.get(pactBrokerRootResponse, template);
    }

    public constructor(private readonly pactBrokerClient: PactBrokerClient) {
    }

    public async loadPacts(options: PactBrokerUserOptions): Promise<SerializedMock[]> {
        const providerPactsUrl = await this.getUrlForProviderPacts(options);
        const pactUrls = await this.getPactUrls(providerPactsUrl);

        return this.getPacts(pactUrls);
    }

    private async getUrlForProviderPacts(options: PactBrokerUserOptions): Promise<string> {
        const pactBrokerRootResponse =
            await this.pactBrokerClient.loadAsObject<PactBrokerRootResponse>(options.pactBrokerUrl);

        if (options.tag){
            return this.getUrlForProviderPactsByTag(pactBrokerRootResponse, {
                pactBrokerUrl: options.pactBrokerUrl,
                providerName: options.providerName,
                tag: options.tag
            })
        } else if (options.branch){
            return this.getUrlForProviderPactsByBranch(pactBrokerRootResponse, {
                pactBrokerUrl: options.pactBrokerUrl,
                providerName: options.providerName,
                branch: options.branch
            })
        } else {
            return this.getUrlForAllProviderPacts(pactBrokerRootResponse, options);
        }
    }

    private getUrlForProviderPactsByTag(pactBrokerRootResponse: PactBrokerRootResponse,
                                        options: PactBrokerUserOptionsWithTag): string {
        const providerTemplateUrl = PactBroker.getProviderTemplateUrl(
            pactBrokerRootResponse,
            '_links.pb:latest-provider-pacts-with-tag.href'
        );

        if (!providerTemplateUrl) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${options.pactBrokerUrl}": No latest pact file url found for tag`
            );
        }

        return this.getSpecificUrlFromTemplate(
            providerTemplateUrl, {provider: options.providerName, tag: options.tag}
        );
    }

    private getUrlForProviderPactsByBranch(pactBrokerRootResponse: PactBrokerRootResponse,
                                        options: PactBrokerUserOptionsWithBranch): string {
        const providerTemplateUrl = PactBroker.getProviderTemplateUrl(
            pactBrokerRootResponse,
            '_links.pb:latest-provider-pacts-with-branch.href'
        );

        if (!providerTemplateUrl) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${options.pactBrokerUrl}": No latest pact file url found for tag`
            );
        }

        return this.getSpecificUrlFromTemplate(
            providerTemplateUrl, {provider: options.providerName, branch: options.branch}
        );
    }

    private getUrlForAllProviderPacts(
        pactBrokerRootResponse: PactBrokerRootResponse,
        options: PactBrokerUserOptions
    ): string {
        const providerTemplateUrl = PactBroker.getProviderTemplateUrl(
            pactBrokerRootResponse,
            '_links.pb:latest-provider-pacts.href'
        );

        if (!providerTemplateUrl) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${options.pactBrokerUrl}": No latest pact file url found`
            );
        }

        return this.getSpecificUrlFromTemplate(
            providerTemplateUrl, {provider: options.providerName}
        );
    }

    private getSpecificUrlFromTemplate(
        providerTemplateUrl: string, parameters: { [key: string]: string }
    ): string {
        let specificUrl = providerTemplateUrl;
        Object.keys(parameters).forEach((key) => {
            const encodedParameterValue = encodeURIComponent(parameters[key]);
            specificUrl = specificUrl.replace(`{${key}}`, encodedParameterValue);
        });

        return specificUrl;
    }

    private async getPactUrls(providerPactsUrl: string): Promise<string[]> {
        const providerUrlResponse =
            await this.pactBrokerClient.loadAsObject<PactBrokerProviderPacts>(providerPactsUrl);
        const providerPactEntries: PactBrokerProviderPactsLinksPact[] = _.get(providerUrlResponse, '_links.pacts', []);

        return _.map(providerPactEntries, (providerPact) => providerPact.href);
    }

    private async getPacts(pactUrls: string[]): Promise<SerializedMock[]> {
        return Promise.all(pactUrls.map(async (mockPathOrUrl): Promise<SerializedMock> => ({
            content: await this.pactBrokerClient.loadAsString(mockPathOrUrl),
            format: 'auto-detect',
            pathOrUrl: mockPathOrUrl
        })));
    }
}
