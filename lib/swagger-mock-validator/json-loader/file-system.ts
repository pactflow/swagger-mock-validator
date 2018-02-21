import * as fs from 'fs';
import {FileSystem} from '../types';

export const defaultFileSystem: FileSystem = {
    readFile: (fileName) => {
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
};
