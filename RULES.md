# Swagger Mock Validator Rules

This is a list of all the possible validation rules and if they are currently supported or not.

## Request

| Feature | Supported |
|---|---|
| Request Accepts | yes |
| Request Authorization Basic | yes |
| Request Authorization Api Key | yes |
| Request Authorization OAuth2 | no |
| Request Body Schema | yes |
| Request Body Form | no |
| Request Content Type | yes |
| Request Headers | yes |
| Request Path | yes |
| Request Base Path| yes |
| Request path params | yes |
| Request query params | yes |
| Deprecated | no |


## Response

| Feature | Supported |
|---|---|
| Response Body Schema | yes |
| Response Body Form | no |
| Response Content Type | yes |
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
| Type Array | yes |
| Type File | no |
| Type Integer | yes |
| Type Number | yes |
| Type String | yes |
| required | yes |
| enum | yes |
| pattern | yes |
| minLength | yes |
| maxLength | yes |
| multipleOf | yes |
| minimum | yes |
| exclusiveMinimum | yes |
| maximum | yes |
| exclusiveMaximum | yes |
| minItems | yes |
| maxItems | yes |
| uniqueItems | yes |
| allowEmptyValue | no |        

## JSON Schema

| Feature | Supported |
|---|---|
| Definition references | yes |
| External references | unknown |
| Circular references | yes |
| Inline schema | yes |
| allOf | yes |
| discriminator | no |
| additional properties with Swagger formats | yes |

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
| YAML | yes |
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
| Pact broker support | yes |
| Configurable validation behaviour control | no |
