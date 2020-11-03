"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
const swagger_mock_validator_error_impl_1 = require("./swagger-mock-validator-error-impl");
class FileStore {
    constructor(fileSystem, httpClient) {
        this.fileSystem = fileSystem;
        this.httpClient = httpClient;
    }
    static isUrl(pathOrUrl) {
        return pathOrUrl.indexOf('http') === 0;
    }
    loadFile(pathOrUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.loadPathOrUrl(pathOrUrl);
            }
            catch (error) {
                throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_READ_ERROR', `Unable to read "${pathOrUrl}"`, error);
            }
        });
    }
    loadPathOrUrl(pathOrUrl) {
        if (FileStore.isUrl(pathOrUrl)) {
            return this.httpClient.get(pathOrUrl);
        }
        return this.fileSystem.readFile(pathOrUrl);
    }
}
exports.FileStore = FileStore;
