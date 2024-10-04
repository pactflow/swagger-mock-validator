import _ from 'lodash';
import {PactBrokerClient} from './clients/pact-broker-client';
import {SwaggerMockValidatorErrorImpl} from './swagger-mock-validator-error-impl';
import {
    PactBrokerProviderPacts,
    PactBrokerProviderPactsLinksPact,
    PactBrokerRootResponse,
    PactBrokerPacticipantResponse,
    PactBrokerUserOptions,
    PactBrokerUserOptionsWithTag,
    ParsedSwaggerMockValidatorOptions,
    SerializedMock
} from './types';
import {ValidationOutcome} from '../api-types';
import {ParsedMock} from './mock-parser/parsed-mock';

export class PactBroker {
    private static getProviderTemplateUrl(pactBrokerRootResponse: PactBrokerRootResponse, template: string): string {
        return _.get(pactBrokerRootResponse, template);
    }

    public constructor(private readonly pactBrokerClient: PactBrokerClient) {}

    public async loadPacts(options: PactBrokerUserOptions): Promise<SerializedMock[]> {
        const providerPactsUrl = await this.getUrlForProviderPacts(options);
        const pactUrls = await this.getPactUrls(providerPactsUrl);

        return this.getPacts(pactUrls);
    }

    public async publishVerificationResult(
        {
            providerApplicationVersion,
            buildUrl,
            providerBranch,
            providerTags,
            mockPathOrUrl,
            mockSource,
            providerName,
        }: ParsedSwaggerMockValidatorOptions,
        { verificationUrl }: ParsedMock,
        { success }: ValidationOutcome,
    ): Promise<void> {
        // if (mockSource !== 'pactBroker') {
        //     throw new SwaggerMockValidatorErrorImpl(
        //         'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
        //         `verification results can only be published for pacts sourced from a Pact Broker`,
        //     );
        // }
        if (!providerApplicationVersion) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `providerApplicationVersion is required to publish verification results`,
            );
        }
        if (!verificationUrl) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `No verification publication url available in pact`,
            );
        }

        let branchVersionUrl;
        let versionTagUrl;
        if ((providerBranch || providerTags) && providerName) {
            const pactBrokerRootResponse = await this.pactBrokerClient.loadAsObject<PactBrokerRootResponse>(
                mockPathOrUrl
            );
            const pactBrokerPacticipantUrl = pactBrokerRootResponse._links['pb:pacticipant'].href;
            const pactBrokerPacticipantResponse = await this.pactBrokerClient.loadAsObject<PactBrokerPacticipantResponse>(
               this.getSpecificUrlFromTemplate(pactBrokerPacticipantUrl,{pacticipant: providerName}),
            );
            branchVersionUrl = pactBrokerPacticipantResponse._links['pb:branch-version'].href;
            versionTagUrl = pactBrokerPacticipantResponse._links['pb:version-tag'].href;
        }

        if (providerBranch && providerName && branchVersionUrl) {
            await this.pactBrokerClient.put(
                this.getSpecificUrlFromTemplate(branchVersionUrl, {
                    provider: providerName,
                    branch: providerBranch,
                    version: providerApplicationVersion,
                }),
                {
                    version: providerApplicationVersion,
                    branch: providerBranch,
                },
            );
        }

        if (providerTags && providerName && versionTagUrl) {
            const tags = providerTags.split(',');
            for (const tag of tags) {
                await this.pactBrokerClient.put(
                    this.getSpecificUrlFromTemplate(versionTagUrl, { tag: tag, version: providerApplicationVersion }),
                    {
                        version: providerApplicationVersion,
                        tag: tag,
                    },
                );
            }
        }

        return this.pactBrokerClient.post(verificationUrl, {
            success,
            providerApplicationVersion,
            buildUrl,
        });
    }

    private async getUrlForProviderPacts(options: PactBrokerUserOptions): Promise<string> {
        const pactBrokerRootResponse = await this.pactBrokerClient.loadAsObject<PactBrokerRootResponse>(
            options.pactBrokerUrl,
        );

        return options.tag
            ? this.getUrlForProviderPactsByTag(pactBrokerRootResponse, {
                  pactBrokerUrl: options.pactBrokerUrl,
                  providerName: options.providerName,
                  tag: options.tag,
              })
            : this.getUrlForAllProviderPacts(pactBrokerRootResponse, options);
    }

    private getUrlForProviderPactsByTag(
        pactBrokerRootResponse: PactBrokerRootResponse,
        options: PactBrokerUserOptionsWithTag,
    ): string {
        const providerTemplateUrl = PactBroker.getProviderTemplateUrl(
            pactBrokerRootResponse,
            '_links.pb:latest-provider-pacts-with-tag.href',
        );

        if (!providerTemplateUrl) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${options.pactBrokerUrl}": No latest pact file url found for tag`,
            );
        }

        return this.getSpecificUrlFromTemplate(providerTemplateUrl, {
            provider: options.providerName,
            tag: options.tag,
        });
    }

    private getUrlForAllProviderPacts(
        pactBrokerRootResponse: PactBrokerRootResponse,
        options: PactBrokerUserOptions,
    ): string {
        const providerTemplateUrl = PactBroker.getProviderTemplateUrl(
            pactBrokerRootResponse,
            '_links.pb:latest-provider-pacts.href',
        );

        if (!providerTemplateUrl) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${options.pactBrokerUrl}": No latest pact file url found`,
            );
        }

        return this.getSpecificUrlFromTemplate(providerTemplateUrl, { provider: options.providerName });
    }

    private getSpecificUrlFromTemplate(providerTemplateUrl: string, parameters: { [key: string]: string }): string {
        let specificUrl = providerTemplateUrl;
        Object.keys(parameters).forEach((key) => {
            const encodedParameterValue = encodeURIComponent(parameters[key]);
            specificUrl = specificUrl.replace(`{${key}}`, encodedParameterValue);
        });

        return specificUrl;
    }

    private async getPactUrls(providerPactsUrl: string): Promise<string[]> {
        const providerUrlResponse = await this.pactBrokerClient.loadAsObject<PactBrokerProviderPacts>(providerPactsUrl);
        const providerPactEntries: PactBrokerProviderPactsLinksPact[] = _.get(providerUrlResponse, '_links.pacts', []);

        return _.map(providerPactEntries, (providerPact) => providerPact.href);
    }

    private async getPacts(pactUrls: string[]): Promise<SerializedMock[]> {
        return Promise.all(
            pactUrls.map(
                async (mockPathOrUrl): Promise<SerializedMock> => ({
                    content: await this.pactBrokerClient.loadAsString(mockPathOrUrl),
                    format: 'auto-detect',
                    pathOrUrl: mockPathOrUrl,
                }),
            ),
        );
    }
}
