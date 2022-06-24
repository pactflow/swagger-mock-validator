# Frequently Asked Questions

## I have a misspelled property in my pact response body but swagger mock validator says that this is valid, why?
  
The key to understanding what happens here is to understand how additionalProperties works in JSON Schema (which is what Swagger uses to define the shape of request and response bodies).

additionalProperties can have one of three values:
- `true` which means additional properties are allowed on the object
- `false` which means additional properties are not allowed on the object
- `object` where the object is a json schema object, which means additional properties are allowed on the object but the values of each property must match the json schema provided
   
Critically, when additionalProperties is not defined it defaults to true.
   
My advice for Swagger authors would be to follow Postel's law and be conservative in what you send and liberal in what you accept. So request bodies should allow additional properties in objects (liberal) and response bodies should not allow additional properties in objects (conservative).
   
Why didn't we just make swagger mock validator fail when additional properties were detected in response bodies by default? Well we actually started this way but ran into the following issue:
   
Imagine you have this schema as a response body:
```json   
{
   "properties": {
       "firstName": {
           "type": "string"
       },
       "lastName": {
           "type": "string"
       }
   },
   "type": "object"
}
```

If swagger-mock-validator did default to disallowing additional properties in response bodies then this body would be valid:

```json   
{
   "firstName": "Bob",
   "lastName": "Smith"
} 
```

And this body would be invalid:   
```json
{
   "first": "Bob",
   "last": "Smith"
}
```

So far everything is ok. But now imagine we changed the response body schema to this:

```json   
   {
       "allOf": [
           {
               "properties": {
                   "firstName": {
                       "type": "string"
                   }
               },
               "type": "object"
           },
           {
               "properties": {
                   "lastName": {
                       "type": "string"
                   }
               },
               "type": "object"
           }
       ]
   }
```

The allOf operator is a way of passing multiple schemas and applying them to the same object. In order to be considered valid the object must pass validation of both schemas. So now lets take the example that worked for the previous schema:
```json
{
   "firstName": "Bob",
   "lastName": "Smith"
}
```   
 
This example will fail to validate against both of the nested schemas! In the schema containing the firstName property it will fail because lastName is an additional property, and in the schema containing lastName it will fail because firstName is an additional property. The only value that would be considered valid is an empty object!
   
So we had to change the behaviour of swagger-mock-validator to follow the defaults of JSON Schema so that we did not break keywords such as allOf, anyOf and oneOf.

## I have a required property in my swagger resposne body but swagger mock validator does not fail when the pact response body mock is missing this property, why?

We are intentionally removing the required property from request schemas as part of our validation process. I'll explain the thinking behind this via an example:

Imagine we have a User Service that exposes an API that allows consumers to get user details (e.g. GET /user/{id}). Let's say this endpoint returns a user entity that contains 20 properties, all of them required properties.

Let's also imagine we have a Billing Service that is written by a seperate team, lives in a seperate code repository to the User Service and is deployed independently. Let's say one of the features of the Billing Service is that it sends the user an email reminding them when a payment is due soon. In order to implement this the Billing Service calls the User Service API to get 3 properties of the user: first name, last name and email address.

Finally, let's imagine the Billing Service has tests for this functionality and in those tests the User Service API is mocked out. The swagger-mock-validator tool is used in both the User Service and Billing Service to ensure this mock is compatible with the User Service Swagger file anytime either service is changed.

If swagger-mock-validator does not remove the required property from the user entity schema there would be 2 negative consequences in this scenario:

- The Billing Service mock would have to include all 20 of the required properties, even though only 3 are actually needed.
- If the User Service was to add a new required property to the user entity it would cause the User Service build to fail because the mock will not contain this extra property (a false positive). In order to make this change the User Service would first have to go ask the Billing Service team to add this new property to their mock. If the user entity had "additionalProperties" set to false on the user object it would complicate the process to make this change even further.

Now let me explore the the side effects you raised:

- If the User Service adds a new property (required or optional), assuming the Billing Service has been written to follow Postel's law then nothing will be broken by this change.
- If the User Service removes a property then the behaviour of swagger-mock-validator will depend on what the user entity schema has set in "additionalProperties". If it is false then when the User Service tries to validate the Billing Service mock it will fail because the Billing Service mock contains the removed field and additional properties are not permitted by the schema. If it is true then, unfortunately, swagger-mock-validator will consider this change valid even though it is not (a false negative).
- A rename is the same as removing one property and adding another

Since neither option is flawless we made the tradeoff decision to remove the required property from request schemas and as a result we have this false negative case. We believe this is less disruptive to teams using this tool compared to the false positive case.

I'd make these two suggestions to help reduce the impact of the false negative case:

- If possible, always set additional properties to false on all response schema objects. This avoids the false negative case completely.
- Using a tool to detect backward incompatible changes to the swagger file. We have been working on a tool called openapi-diff that will detect breaking changes between two swagger/openapi files that may help, although it is still a work in progress.

## Pactflow fails my contract verification, stating that the 'Response Body Contains Unknown Information'. My OpenAPI specification is valid and matches the expectations in my consumer contract. How come?

Here's one reason that this error occurs when verifying your bidirectional contracts.

The current OpenAPI specification supports wildcards for the `content` field defining the media type of a response payload. See [this section in the OpenAPI 3.1.0 specification](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#fixed-fields-15) for more details.

It allows developers to support different media types (e.g., JSON and XML) for the response payloads without having to define separate specifications.

So, for example, this snippet defining responses for an operation is valid, according to the OpenAPI specification:

```json
"responses": {
    "404": {
        "description": "Not Found"
    },
    "400": {
        "description": "Bad Request"
    },
    "200": {
        "description": "OK",
        "content": {
            "*/*": {
                "schema": {
                    "$ref": "#/components/schemas/Address"
                }
            }
        }
    }
}
```

where `Address` is an [OpenAPI Schema Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#schemaObject).


However, these wildcards are not supported by the swagger mock validator. Using an OpenAPI specification containing these wildcards will result in the aforementioned error, with Pactflow reporting:

```text
Response Body Contains Unknown Information.

No schema found for response body
```

The recommended solution is to replace the wildcards with the applicable specific content type, such as `application/json`:

```json
"responses": {
    "404": {
        "description": "Not Found"
    },
    "400": {
        "description": "Bad Request"
    },
    "200": {
        "description": "OK",
        "content": {
            "application/json": {
                "schema": {
                    "$ref": "#/components/schemas/Address"
                }
            }
        }
    }
}
```

If there are indeed no mismatches between expectations in the consumer bidirectional contract and the provider specification contract, Pactflow will upon reverification no longer fail the bidirectional contract verification.