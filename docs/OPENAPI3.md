# OpenApi 3 Support

This is a list of all the relevant field names in OpenApi 3 and if the validation supports them.

## OpenAPI Object

| Field Name | Supported |
| --- | --- |
| servers | no |
| paths | yes |
| components | yes |
| security | yes |

## Server Object

| Field Name | Supported |
| --- | --- |
| url | no |
| variables | no |

## Server Variable Object

| Field Name | Supported |
| --- | --- |
| enum | no |
| default | no |
| description | no |

## Components Object

| Field Name | Supported |
| --- | --- |
| schemas | yes |
| responses | yes |
| parameters | yes |
| requestBodies | yes |
| headers | yes |
| securitySchemes | yes |
| callbacks | no |

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
| trace | yes |
| servers | no |
| parameters | yes |

## Operation Object

| Field Name | Supported |
| --- | --- |
| parameters | yes |
| requestBody | yes |
| responses | yes |
| callbacks | no |
| deprecated | no |
| security | yes |
| servers | no |

## Parameter Object

| Field Name | Supported |
| --- | --- |
| name | yes |
| in | partial (yes for query, header and path, no for cookie) |
| required | yes |
| deprecated | no |
| allowEmptyValue | no |
| style | no |
| explode | no |
| allowReserved | no |
| schema | yes |
| content | no |
| matrix | no |
| label | no |
| form | no |
| simple | no |
| spaceDelimited | no |
| pipeDelimited | no |
| deepObject | no |

## Request Body Object

| Field Name | Supported |
| --- | --- |
| content | partially (yes for application/json, no for all other mime types)
| required | yes |

## Media Type Object

| Field Name | Supported |
| --- | --- |
| schema | yes |
| encoding | no |

## Encoding Object

| Field Name | Supported |
| --- | --- |
| contentType | no |
| headers | no |
| style | no |
| explode | no |
| allowReserved | no |

## Responses Object

| Field Name | Supported |
| --- | --- |
| {http status code} | partially (yes for specific status codes, no for ranges) |
| default | yes |

## Response Object

| Field Name | Supported |
| --- | --- |
| headers | yes |
| content | partially (yes for application/json, no for all other mime types)
| links | no |

## Callback Object

Not supported

## Link Object

| Field Name | Supported |
| --- | --- |
| operationRef | no |
| operationId | no |
| parameters | no |
| requestBody | no |
| description | no |
| server | no |

## Header Object

| Field Name | Supported |
| --- | --- |
| required | yes |
| deprecated | no |
| allowEmptyValue | no |
| style | no |
| explode | no |
| allowReserved | no |
| schema | yes |
| content | no |
| simple | no |

## Schema Object

| Field Name | Supported |
| --- | --- |
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
| allOf | yes |
| oneOf | yes |
| anyOf | yes |
| not | yes |
| items | yes |
| properties | yes |
| additionalProperties | yes |
| format | yes |
| nullable | no |
| discriminator | no |
| readOnly | no |
| writeOnly | no |
| xml | no |
| deprecated | no |

## Discriminator Object

| Field Name | Supported |
| --- | --- |
| propertyName | no |
| mapping | no |

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
| type | partial (yes for http and apiKey, no for oauth2 and openIdConnect) |
| name | yes |
| in | partial (yes for query and header, no for cookie) |
| scheme | no |
| bearerFormat | no |
| flows | no |
| openIdConnectUrl | no |

## OAuth Flows Object

| Field Name | Supported |
| --- | --- |
| implicit | no |
| password | no |
| clientCredentials | no |
| authorizationCode | no |
