# Swagger Pact Validator Rules

This is a list of all the possible validation rules and if they are currently supported or not.

## Request

| Feature | Supported |
|---|---|
| Request Accepts | no |
| Request Authorization | no |
| Request Body Schema | yes |
| Request Body Form | no |
| Request Content Type | no |
| Request Headers | yes |
| Request Path | yes |
| Request path params | yes |
| Request query params | no |


## Response

| Feature | Supported |
|---|---|
| Response Body Schema | yes |
| Response Body Form | no |
| Response Headers | yes |
| Response Status | yes |

## Parameter Validation

| Feature | Supported |
|---|---|
| Format Binary | yes |
| Format Byte | yes |
| Format Date | yes |
| Format Date-Time | yes |
| Format Double | yes |
| Format Float | yes |
| Format Int32 | yes |
| Format Int64 | yes |
| Format Password | yes |
| Type Array | no |
| Type File | no |
| Type Integer | yes |
| Type Number | yes |
| Type String | yes |
| required | yes |
| enum | no |
| pattern | no |
| minLength | no |
| maxLength | no |
| multipleOf | no |
| minimum | no |
| exclusiveMinimum | no |
| maximum | no |
| exclusiveMaximum | no |
| minItems | no |
| maxItems | no |
| uniqueItems | no |

## JSON Schema

| Feature | Supported |
|---|---|
| Definition references | yes |
| External references | unknown |
| Inline schema | yes |
| allOf | no |
| discriminator | no |

## Source Location

| Feature | Supported |
|---|---|
| Local file system | yes |
| URL | yes |


## Spec Format

| Feature | Supported |
|---|---|
| Swagger 1.0 | no |
| Swagger 2.0 | yes |
| JSON | yes |
| YAML | no |
| RAML | no |

## Mock Format

| Feature | Supported |
|---|---|
| Pact | yes |
| RestAssured | no |
| WireMock | no |

## Other

| Feature | Supported |
|---|---|
| Pact broker support | no |
| Configurable validation behaviour control | no |
