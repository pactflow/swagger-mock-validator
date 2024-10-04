import {SwaggerMockValidatorErrorImpl} from '../swagger-mock-validator-error-impl';
import {transformStringToObject} from '../transform-string-to-object';
import {HttpClient} from './http-client';

export class PactBrokerClient {
    public constructor(private readonly httpClient: HttpClient) {
    }

    public async loadAsObject<T>(url: string): Promise<T> {
        try {
            const content = await this.httpClient.get(url);

            return transformStringToObject<T>(content, url);
        } catch (error) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', `Unable to read "${url}"`, error
            );
        }
    }

    public async loadAsString(url: string): Promise<string> {
        try {
            return await this.httpClient.get(url);
        } catch (error) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR', `Unable to read "${url}"`, error
            );
        }
    }
}
