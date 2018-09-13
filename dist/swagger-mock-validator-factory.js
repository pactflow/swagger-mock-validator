"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_mock_validator_1 = require("./swagger-mock-validator");
const analytics_1 = require("./swagger-mock-validator/analytics");
const metadata_1 = require("./swagger-mock-validator/analytics/metadata");
const file_system_1 = require("./swagger-mock-validator/clients/file-system");
const http_client_1 = require("./swagger-mock-validator/clients/http-client");
const pact_broker_client_1 = require("./swagger-mock-validator/clients/pact-broker-client");
const file_store_1 = require("./swagger-mock-validator/file-store");
const pact_broker_1 = require("./swagger-mock-validator/pact-broker");
const uuid_generator_1 = require("./swagger-mock-validator/uuid-generator");
class SwaggerMockValidatorFactory {
    static create(auth) {
        const fileSystem = new file_system_1.FileSystem();
        const httpClient = new http_client_1.HttpClient();
        const uuidGenerator = new uuid_generator_1.UuidGenerator();
        const metadata = new metadata_1.Metadata();
        const fileStore = new file_store_1.FileStore(fileSystem, httpClient);
        const pactBrokerClient = new pact_broker_client_1.PactBrokerClient(httpClient, auth);
        const pactBroker = new pact_broker_1.PactBroker(pactBrokerClient);
        const analytics = new analytics_1.Analytics(httpClient, uuidGenerator, metadata);
        return new swagger_mock_validator_1.SwaggerMockValidator(fileStore, pactBroker, analytics);
    }
}
exports.SwaggerMockValidatorFactory = SwaggerMockValidatorFactory;
