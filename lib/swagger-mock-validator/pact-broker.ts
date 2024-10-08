import _ from 'lodash';
import { PactBrokerClient } from './clients/pact-broker-client';
import { SwaggerMockValidatorErrorImpl } from './swagger-mock-validator-error-impl';
import {
    PactBrokerProviderPacts,
    PactBrokerProviderPactsLinksPact,
    PactBrokerRootResponse,
    PactBrokerUserOptions,
    PactBrokerUserOptionsWithTag,
    ParsedSwaggerMockValidatorOptions,
    SerializedMock,
} from './types';
import { ValidationOutcome } from '../api-types';
import { ParsedMock } from './mock-parser/parsed-mock';

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
        { success, errors, warnings }: ValidationOutcome,
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
            const pactBrokerRootResponse =
                await this.pactBrokerClient.loadAsObject<PactBrokerRootResponse>(mockPathOrUrl);
            branchVersionUrl = pactBrokerRootResponse._links['pb:pacticipant-branch-version'].href;
            versionTagUrl = pactBrokerRootResponse._links['pb:pacticipant-version-tag'].href;
        }
        try {
            if (providerBranch && providerName && branchVersionUrl) {
                await this.pactBrokerClient.put(
                    this.getSpecificUrlFromTemplate(branchVersionUrl, {
                        pacticipant: providerName,
                        branch: providerBranch,
                        version: providerApplicationVersion,
                    }),
                    {},
                );
            }
        } catch (e) {
            console.error('Failed to create provider branch for verification result', e.message);
        }

        try {
            if (providerTags && providerName && versionTagUrl) {
                const tags = providerTags.split(',');
                for (const tag of tags) {
                    await this.pactBrokerClient.put(
                        this.getSpecificUrlFromTemplate(versionTagUrl, {
                            pacticipant: providerName,
                            tag: tag,
                            version: providerApplicationVersion,
                        }),
                        {},
                    );
                }
            }
        } catch (e) {
            console.error('Failed to create provider tag for verification result', e.message);
        }

        const testResults = [
            ...errors.map((error) => ({
                interactionDescription: error.mockDetails?.interactionDescription,
                interactionId: null,
                success: false,
                mismatches: [
                    {
                        attribute: error.code,
                        description: error.message,
                        identifier: error.mockDetails?.value,
                    },
                ],
            })),
            ...warnings.map((warning) => ({
                interactionDescription: warning.mockDetails?.interactionDescription,
                interactionId: null,
                success: true,
                mismatches: [
                    {
                        attribute: warning.code,
                        description: warning.message,
                        identifier: warning.mockDetails?.value,
                    },
                ],
            })),
        ];
        console.log(testResults);
        return this.pactBrokerClient.post(verificationUrl, {
            success,
            providerApplicationVersion,
            buildUrl,
            testResults,
            verifiedBy: {
                implementation: 'swagger-mock-validator',
            },
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
