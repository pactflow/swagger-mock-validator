import { FileSystem } from './clients/file-system';
import { HttpClient } from './clients/http-client';
import { SwaggerMockValidatorErrorImpl } from './swagger-mock-validator-error-impl';

export class FileStore {
    public static isUrl(pathOrUrl: string): boolean {
        return pathOrUrl.indexOf('http') === 0;
    }

    public constructor(private readonly fileSystem: FileSystem, private readonly httpClient: HttpClient) {}

    public async loadFile(pathOrUrl: string): Promise<string> {
        try {
            if (process.env.PACT_BROKER_TOKEN != '' && pathOrUrl.includes('internal/contracts/bi-directional')) {
                const result = await this.loadPathOrUrl(pathOrUrl);
                const providerContractContent = JSON.parse(result)._embedded['providerContract']['content'];
                return Promise.resolve(providerContractContent);
            } else {
                return await this.loadPathOrUrl(pathOrUrl);
            }
        } catch (error) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${pathOrUrl}"`,
                error
            );
        }
    }

    private loadPathOrUrl(pathOrUrl: string) {
        if (FileStore.isUrl(pathOrUrl)) {
            return this.httpClient.get(pathOrUrl);
        }

        return this.fileSystem.readFile(pathOrUrl);
    }
}
