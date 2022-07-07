# Pact Support

Pact v1, v2, v3 and v4 specifications are supported.
This is a list of all the relevant field names in Pact and if the validation supports them.

When using [Pact specification V4](https://github.com/pact-foundation/pact-specification/tree/version-4) note that only interactions with type "Synchronous/HTTP" are validated. Validation will ignore other interaction types such as "Asynchronous/Messages" which cannot be directly compared to an OAS.

## Pact Object

| Field Name | Supported |
| --- | --- |
| consumer | yes |
| interactions | yes |
| provider | yes |

## Pacticipant Object

| Field Name | Supported |
| --- | --- |
| name | yes |

## Interaction Object

| Field Name | Supported |
| --- | --- |
| description | yes |
| provider_state | yes |
| providerState | yes |
| request | yes |
| response | yes |

## Request Object

| Field Name | Supported |
| --- | --- |
| body | yes |
| headers | yes |
| matchingRules | no |
| method | yes |
| path | yes |
| query | yes |

## Response Object

| Field Name | Supported |
| --- | --- |
| body | yes |
| headers | yes |
| matchingRules | no |
| status | yes |
