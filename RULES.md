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
| Request Headers | no |
| Request Path | yes |
| Request path params | yes |
| Request query params | no |


## Response

| Feature | Supported |
|---|---|
| Response Body Schema | yes, but not default response bodies |
| Response Body Form | no |
| Response Headers | no |
| Response Status | yes, but not default response statuses |

## Parameter Validation

| Feature | Supported |
|---|---|
| Format Binary | no |
| Format Byte | no |
| Format Date | no |
| Format Date-Time | no |
| Format Double | no |
| Format Float | no |
| Format Int32 | no |
| Format Int64 | no |
| Format Password | no |
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
