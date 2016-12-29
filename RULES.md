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
| Format Int64* | yes |
| Format Password | yes |
| Type Array | no |
| Type File | no |
| Type Integer | yes |
| Type Number | yes |
| Type String | yes |
| required | yes |
| enum | yes |
| pattern | no |
| minLength | no |
| maxLength | no |
| multipleOf | no |
| minimum | no |
| exclusiveMinimum | no |
| maximum | yes |
| exclusiveMaximum | yes |
| minItems | no |
| maxItems | no |
| uniqueItems | no |

\* JavaScript and JSON numbers are [IEEE 754-2008](https://en.wikipedia.org/wiki/IEEE_floating_point) 64bit Floating Point numbers. This means the safe integer range is -(2^53 - 1) to 2^53 - 1, less then the range of int64. Values outside this range can be represented, but some precision is lost. So be aware that when validating values that fall outside the safe integer range that the lost precision means not all invalid int64 values can be detected.        

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
