import q = require('q');
import {CoverageReporter, SpecOperationCoverage, SpecResponseCoverage} from '../types';

function displayResults(specCoverage: SpecOperationCoverage[]) {
    specCoverage.forEach((specOperationCoverage: SpecOperationCoverage) => {
        console.log('Operation: ', specOperationCoverage.operation.location);
        specOperationCoverage.responses.forEach((specResponseCoverage: SpecResponseCoverage) => {
            const response = specResponseCoverage.response.location;
            console.log(`  Response: ${response} ( ${specResponseCoverage.interactions.length} hits)`);
            specResponseCoverage.interactions.forEach((interaction) => {
                console.log(`    * ${interaction.description} (${interaction.mockFile})`);
            });
        });
    });
}

const coverageReporter: CoverageReporter = {
    generate: (specCoverage: SpecOperationCoverage[]) => {
        return q.fcall(displayResults, specCoverage);
    }
};

export default coverageReporter;
