import os from 'os';

import packageJson from "../../../package.json";

export class Metadata {
    public getHostname(): string {
        return os.hostname();
    }

    public getOsVersion(): string {
        return `${os.platform()} ${os.arch()} ${os.release()}`;
    }

    public getToolVersion(): string {
        return packageJson.version;
    }

    public getUptime(): number {
        return process.uptime();
    }
}
