##  Pact file and OAS contract verification examples
These examples demonstrate comparing an OAS contract and a Pact file using pactflow/swagger-mock-validator.
The sample OAS files use keywords anyOf, allOf and oneOf to demonstrate how these keywords are supported by the tool.
There is also a demonstration of a function that de-references `$ref` values, as these are not well supported in the tool currently.

**De-Reference the contract**
```
npm i
node ./index.js <path-to-oas-file>
```
The de-referenced version of the OAS contract will be output to 'resolved.json' file.

**Run comparison between Pact file and OAS**
```
npm i
npx @pactflow/swagger-mock-validator <path-to-oas-file> <path-to-pact-file> --additionalPropertiesInResponse false
```
