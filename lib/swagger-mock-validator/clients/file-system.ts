import fs from 'fs';

export class FileSystem {
    public readFile(fileName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (error, file) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(file.toString());
                }
            });
        });
    }
}
