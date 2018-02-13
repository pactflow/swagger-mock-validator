import {FileStore} from './file-store';
import {transformStringToObject} from './transform-string-to-object';

export class ResourceLoader {

    public constructor(private readonly fileStore: FileStore) {
        this.fileStore = fileStore;
    }

    public async load<T>(pathOrUrl: string): Promise<T> {
        const content = await this.fileStore.loadFile(pathOrUrl);

        return transformStringToObject<T>(content, pathOrUrl);
    }
}
