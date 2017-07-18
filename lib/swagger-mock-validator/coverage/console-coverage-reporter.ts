import * as chalk from 'chalk';
import * as Table from 'cli-table2';
import {CoverageHit, ParsedSpecOperation, SpecCoverage, SpecOperationCoverage, SpecResponseCoverage} from '../types';

function getCoverageHitDescription(hit: CoverageHit): string {
    return `${hit.mock.consumer} -> ${hit.mock.provider}: ${hit.interaction.description}`;
}

interface ReportRow {
    type: 'spec' | 'operation' | 'response';
    hits: number;
    style?: chalk.ChalkChain;
    text: string;
    details?: string;
}

const rowFormat = {
    operation: (text: any, hits: number, details: string) => [
        '', {colSpan: 2, content: text}, chalk.bold(hits.toString()), details
    ],
    response: (text: any, hits: number, details: string) => [
        '', '', text, hits, chalk.white(details)
    ],
    spec: (text: any, hits: number, details: string) => [
        {colSpan: 3, content: chalk.bold(text)}, chalk.bold(hits.toString()), details
    ]
};

function toTableRow(row: ReportRow) {
    const style = row.style || chalk.white;
    return rowFormat[row.type](style(row.text), row.hits, (row.details || ''));
}

function printReport(rows: ReportRow[]) {
    const table: any = new Table({
        head: ['Spec', 'Operation', 'Response', 'Hits', 'Interactions'].map((header) => chalk.bold(header)),
        style: {head: []},
        wordWrap: true
    });
    rows.forEach((row: ReportRow) => {
        table.push(toTableRow(row));
    });
    console.log(chalk.bold('Spec Coverage:'));
    console.log(chalk.bold('=============='));
    console.log(table.toString());
}

function toResponseRow(responseCoverage: SpecResponseCoverage): ReportRow {
    let response = responseCoverage.response.location;
    response = response.substr(response.lastIndexOf('.') + 1);
    const hits = responseCoverage.hits.length;

    return {
        details: responseCoverage.hits.map((hit: CoverageHit) => getCoverageHitDescription(hit)).join('\n'),
        hits,
        style: hits === 0 ? chalk.red : chalk.green,
        text: response,
        type: 'response'
    };
}

function getOperationDisplayName(operation: ParsedSpecOperation) {
    let name = operation.location.replace(/^\[swaggerRoot\]\.paths\./, '');
    name = name.substr(0, name.lastIndexOf('.'));
    const method = operation.method || 'default';
    return `${method.toUpperCase()} ${name}`;
}

function displayCoverage(specCoverage: SpecCoverage) {
    const reportRows: ReportRow[] = [];
    const specRow: ReportRow = {type: 'spec', text: specCoverage.spec.pathOrUrl, hits: 0};

    reportRows.push(specRow);

    specCoverage.operations.forEach((specOperationCoverage: SpecOperationCoverage) => {
        const operation = getOperationDisplayName(specOperationCoverage.operation);
        const operationRow: ReportRow = {type: 'operation', text: operation, hits: 0, style: chalk.green};
        reportRows.push(operationRow);

        specOperationCoverage.responses.forEach((specResponseCoverage: SpecResponseCoverage) => {
            const responseRow: ReportRow = toResponseRow(specResponseCoverage);
            reportRows.push(responseRow);
            if (responseRow.hits === 0) {
                operationRow.style = chalk.yellow;
                specRow.style = chalk.yellow;
            }
            operationRow.hits += responseRow.hits;
        });
        if (operationRow.hits === 0) {
            operationRow.style = chalk.red;
        }
        specRow.hits += operationRow.hits;
        if (specRow.hits === 0) {
            specRow.style = chalk.red;
        }
    });
    printReport(reportRows);
}

export default displayCoverage;
