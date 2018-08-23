"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
// tslint:disable:no-var-requires
const packageJson = require('../../../package.json');
class Metadata {
    getHostname() {
        return os.hostname();
    }
    getOsVersion() {
        return `${os.platform()} ${os.arch()} ${os.release()}`;
    }
    getToolVersion() {
        return packageJson.version;
    }
    getUptime() {
        return process.uptime();
    }
}
exports.Metadata = Metadata;
