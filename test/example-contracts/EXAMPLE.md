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

## Additional Examples

### Query Strings

Demonstrate consumer query strings encoded in Pact file, but not described in OAD, returns a warning from SMV

Change:- Addition of `id=2` query string in Pact file.

```
$ npx @pactflow/swagger-mock-validator test/example-contracts/products.yml test/example-contracts/queryString/v2/query_param_pact_v2.json
0 error(s)
1 warning(s)
        request.query.unknown: 1
{
  warnings: [
    {
      code: 'request.query.unknown',
      message: 'Query parameter is not defined in the spec file: id',
      mockDetails: {
        interactionDescription: 'displays product item by query',
        interactionState: '[none]',
        location: '[root].interactions[0].request.query.id',
        mockFile: 'test/example-contracts/queryString/v2/query_param_pact_v2.json',
        value: '2'
      },
      source: 'spec-mock-validation',
      specDetails: {
        location: '[root].paths./products.get',
        pathMethod: 'get',
        pathName: '/products',
        specFile: 'test/example-contracts/queryString/products.yml',
        value: {
          summary: 'List all products',
          description: 'Returns all products',
          operationId: 'getAllProducts',
          responses: [Object]
        }
      },
      type: 'warning'
    }
  ],
  errors: []
}
```

### Extra request properties

Demonstrate consumer request body additional fields encoded in Pact file, but not described in OAD, returns **NO** error/warning from SMV

Change:- Addition of `foo` property, with `string` type in Pact file.

```
$ npx @pactflow/swagger-mock-validator test/example-contracts/products.yml test/example-contracts/extraRequestProperty/v2/addtional_request_body_property_v2.json -A true
0 error(s)
0 warning(s)
```