import VError = require('verror');
import {FileSystem, HttpClient} from './types';

export class FileStore {
    public static isUrl(pathOrUrl: string): boolean {
        return pathOrUrl.indexOf('http') === 0;
    }

    public constructor(private readonly fileSystem: FileSystem, private readonly httpClient: HttpClient) {
        this.fileSystem = fileSystem;
        this.httpClient = httpClient;
    }

    public async loadFile(pathOrUrl: string): Promise<string> {
        try {
            return await this.loadPathOrUrl(pathOrUrl);
        } catch (error) {
            throw new VError(error, `Unable to read "${pathOrUrl}"`);
        }
    }

    private loadPathOrUrl(pathOrUrl: string) {
        if (FileStore.isUrl(pathOrUrl)) {
            return this.httpClient.get(pathOrUrl);
        }

        return this.fileSystem.readFile(pathOrUrl);
    }
}
