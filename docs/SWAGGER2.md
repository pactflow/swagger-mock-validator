# Swagger 2 Support

This is a list of all the relevant field names in Swagger 2 and if the validation supports them.

## Swagger Object

| Field Name | Supported |
| --- | --- |
| basePath | yes |
| consumes | partial (mime types only, parameters, e.g. charset, will be disregarded) |
| produces | partial (mime types only, parameters, e.g. charset, will be disregarded) |
| paths | yes |
| definitions | yes |
| parameters | yes |
| responses | yes |
| securityDefinitions | yes |
| security | yes |

## Path Item Object

| Field Name | Supported |
| --- | --- |
| $ref | yes |	
| get | yes |
| put | yes |
| post | yes |
| delete | yes |
| options | yes |
| head | yes |
| patch | yes |
| parameters | yes |

## Operation Object

| Field Name | Supported |
| --- | --- |
| consumes | partial (mime types only, parameters not supported) |
| produces | partial (mime types only, parameters not supported) |
| parameters | yes |
| responses | yes |
| deprecated | no |
| security | yes |

## Parameter Object

| Field Name | Supported |
| --- | --- |
| in | partial (yes for query, header, path and body, no for formData) |
| required | yes |
| schema | yes |
| type | partial (yes for string, number, integer, boolean and array, no for file) |
| format | yes |
| allowEmptyValue | no |
| items | yes |
| collectionFormat | yes |
| maximum | yes |
| exclusiveMaximum | yes |
| minimum | yes |
| exclusiveMinimum | yes |
| maxLength | yes |
| minLength | yes |
| pattern | yes |
| maxItems | yes |
| minItems | yes |
| uniqueItems | yes |
| enum | yes |
| multipleOf | yes |

## Items Object

| Field Name | Supported |
| --- | --- |
| type | yes |
| format | yes |
| items | yes |
| collectionFormat | yes |
| default | yes |
| maximum | yes |
| exclusiveMaximum | yes |
| minimum | yes |
| exclusiveMinimum | yes |
| maxLength | yes |
| minLength | yes |
| pattern | yes |
| maxItems | yes |
| minItems | yes |
| uniqueItems | yes |
| enum | yes |
| multipleOf | yes |

## Responses Object

| Field Name | Supported |
| --- | --- |
| {http status code} | yes |
| default | yes |

## Response Object

| Field Name | Supported |
| --- | --- |
| schema | yes |
| headers | yes |

## Header Object

| Field Name | Supported |
| --- | --- |
| type | yes |
| format | yes |
| items | yes |
| collectionFormat | yes |
| maximum | yes |
| exclusiveMaximum | yes |
| minimum | yes |
| exclusiveMinimum | yes |
| maxLength | yes |
| minLength | yes |
| pattern | yes |
| maxItems | yes |
| minItems | yes |
| uniqueItems | yes |
| enum | yes |
| multipleOf | yes |

## Schema Object

| Field Name | Supported |
| --- | --- |
| $ref | yes |
| format | yes |
| multipleOf | yes |
| maximum | yes |
| exclusiveMaximum | yes |
| minimum | yes |
| exclusiveMinimum | yes |
| maxLength | yes |
| minLength | yes |
| pattern | yes |
| maxItems | yes |
| minItems | yes |
| uniqueItems | yes |
| maxProperties | yes |
| minProperties | yes |
| required | yes |
| enum | yes |
| type | yes |
| items | yes |
| allOf | yes |
| properties | yes |
| additionalProperties | yes |
| discriminator | no |
| readOnly | no |
| xml | no |

## XML Object

| Field Name | Supported |
| --- | --- |
| name | no |
| namespace | no |
| prefix | no |
| attribute | no |
| wrapped | no |

## Security Scheme Object

| Field Name | Supported |
| --- | --- |
| type | partial (yes for basic and apiKey, no for oauth2) |
| name | yes |
| in | yes |
| flow | no |
| authorizationUrl | no |
| tokenUrl | no |
| scopes | no |
