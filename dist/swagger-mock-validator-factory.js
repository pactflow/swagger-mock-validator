"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_mock_validator_1 = require("./swagger-mock-validator");
const analytics_1 = require("./swagger-mock-validator/analytics");
const metadata_1 = require("./swagger-mock-validator/analytics/metadata");
const file_system_1 = require("./swagger-mock-validator/clients/file-system");
const http_client_1 = require("./swagger-mock-validator/clients/http-client");
const file_store_1 = require("./swagger-mock-validator/file-store");
const resource_loader_1 = require("./swagger-mock-validator/resource-loader");
const uuid_generator_1 = require("./swagger-mock-validator/uuid-generator");
class SwaggerMockValidatorFactory {
    static create() {
        const fileSystem = new file_system_1.FileSystem();
        const httpClient = new http_client_1.HttpClient();
        const uuidGenerator = new uuid_generator_1.UuidGenerator();
        const metadata = new metadata_1.Metadata();
        const fileStore = new file_store_1.FileStore(fileSystem, httpClient);
        const resourceLoader = new resource_loader_1.ResourceLoader(fileStore);
        const analytics = new analytics_1.Analytics(httpClient, uuidGenerator, metadata);
        return new swagger_mock_validator_1.SwaggerMockValidator(fileStore, resourceLoader, analytics);
    }
}
exports.SwaggerMockValidatorFactory = SwaggerMockValidatorFactory;
