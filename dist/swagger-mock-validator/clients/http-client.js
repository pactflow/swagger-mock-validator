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
exports.HttpClient = void 0;
const axios_1 = require("axios");
class HttpClient {
    get(url, auth) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = auth
                ? { authorization: 'Basic ' + Buffer.from(auth).toString('base64') }
                : {};
            const response = yield axios_1.default.get(url, {
                headers,
                timeout: 30000,
                transformResponse: (data) => data,
                validateStatus: (status) => status === 200
            });
            return response.data;
        });
    }
    post(url, body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield axios_1.default.post(url, body, {
                timeout: 5000,
                validateStatus: (status) => status >= 200 && status <= 299
            });
        });
    }
}
exports.HttpClient = HttpClient;
