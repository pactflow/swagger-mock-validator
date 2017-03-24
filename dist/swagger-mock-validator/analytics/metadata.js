"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
// tslint:disable:no-var-requires
const packageJson = require('../../../package.json');
const metadata = {
    getHostname: () => os.hostname(),
    getOsVersion: () => `${os.platform()} ${os.arch()} ${os.release()}`,
    getToolVersion: () => packageJson.version,
    getUptime: () => process.uptime()
};
exports.default = metadata;
