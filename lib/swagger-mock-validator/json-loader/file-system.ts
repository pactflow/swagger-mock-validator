import fs = require('fs');
import q = require('q');
import {FileSystem} from '../types';

const fileSystem: FileSystem = {
    readFile: (fileName) => {
        const deferred = q.defer<string>();

        fs.readFile(fileName, (error, file) => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(file.toString());
            }
        });

        return deferred.promise;
    }
};

export default fileSystem;
