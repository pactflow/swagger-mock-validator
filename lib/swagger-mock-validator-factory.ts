import {SwaggerMockValidator} from './swagger-mock-validator';
import {Analytics} from './swagger-mock-validator/analytics';
import {Metadata} from './swagger-mock-validator/analytics/metadata';
import {FileSystem} from './swagger-mock-validator/clients/file-system';
import {HttpClient} from './swagger-mock-validator/clients/http-client';
import {PactBrokerClient} from './swagger-mock-validator/clients/pact-broker-client';
import {FileStore} from './swagger-mock-validator/file-store';
import {PactBroker} from './swagger-mock-validator/pact-broker';
import {UuidGenerator} from './swagger-mock-validator/uuid-generator';

export class SwaggerMockValidatorFactory {
    public static create(): SwaggerMockValidator {
        const fileSystem = new FileSystem();
        const httpClient = new HttpClient();
        const uuidGenerator = new UuidGenerator();
        const metadata = new Metadata();
        const fileStore = new FileStore(fileSystem, httpClient);
        const pactBrokerClient = new PactBrokerClient(httpClient);
        const pactBroker = new PactBroker(pactBrokerClient);
        const analytics = new Analytics(httpClient, uuidGenerator, metadata);
        return new SwaggerMockValidator(fileStore, pactBroker, analytics);
    }
}
