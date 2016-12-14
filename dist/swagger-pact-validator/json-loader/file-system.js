"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fileSystem;
