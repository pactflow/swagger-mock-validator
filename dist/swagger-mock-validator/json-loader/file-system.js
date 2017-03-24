"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const q = require("q");
const fileSystem = {
    readFile: (fileName) => {
        const deferred = q.defer();
        fs.readFile(fileName, (error, file) => {
            if (error) {
                deferred.reject(error);
            }
            else {
                deferred.resolve(file.toString());
            }
        });
        return deferred.promise;
    }
};
exports.default = fileSystem;
