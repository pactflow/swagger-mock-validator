# [10.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/9.0.0...10.0.0) (2020-11-03)


### Bug Fixes

* fix bug when both nullable and swagger custom formats are defined ([ed4acf9](https://bitbucket.org/atlassian/swagger-mock-validator/commits/ed4acf97bd42f68e7cf799f4d2b85e6696ccee23))


### chore

* bump dependencies ([9b959be](https://bitbucket.org/atlassian/swagger-mock-validator/commits/9b959beabd7d96051c83d241dbc7073a00f3504a))


### BREAKING CHANGES

* Dropped support for NodeJS v6 and v8. Migrate to NodeJS v10 or above.



# [9.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/8.0.0...9.0.0) (2019-11-07)


### Bug Fixes

* correctly validate request bodies containing a JSON null or false value ([79fae8c](https://bitbucket.org/atlassian/swagger-mock-validator/commits/79fae8c1cd2175f04070e4980120a699eeb87dff))


### Features

* support the nullable attribute for data types ([d3c13cc](https://bitbucket.org/atlassian/swagger-mock-validator/commits/d3c13cc2f50c7f749a86d2ffa0f09e4bf6d4d6d2))


### BREAKING CHANGES

* Prior to this change the tool used to succeed when a pact request specified a request body containing solely the JSON literals ‘null' or 'false’, regardless of what the spec accepted. Now, request bodies with such values will only pass validation if the spec is okay with them.



# [8.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/7.0.0...8.0.0) (2019-09-18)


### Bug Fixes

* do not fail if an OpenApi 3 spec defines an empty security requirement ([f42ceb1](https://bitbucket.org/atlassian/swagger-mock-validator/commits/f42ceb1))


### BREAKING CHANGES

* Prior to this change the tool used to fail when a pact request with no auth was validated against an OpenApi 3 operation containing a security requirement (e.g. basic auth) plus an empty security requirement (which is normally used to represent that auth is optional). Now empty security requirements are considered for OpenApi3 specs hence not failing when the request lacks auth attributes.



# [7.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/6.0.2...7.0.0) (2019-08-26)


### Bug Fixes

* do not fail if the spec defines unsupported security requirements ([004729a](https://bitbucket.org/atlassian/swagger-mock-validator/commits/004729a))


### BREAKING CHANGES

* Prior to this change the tool used to fail when a pact request with no apparent auth was validated against a swagger operation containing security requirements both supported and unsupported by the tool (e.g. basic auth and OAuth2). Now if at least one unsupported security requirement is defined in the swagger operation the validation will pass. It is recommended that consumers and providers coordinate upgrading to this release so that both sides agree on what is considered valid vs invalid.



## [6.0.2](https://bitbucket.org/atlassian/swagger-mock-validator/compare/6.0.1...6.0.2) (2019-06-14)



<a name="6.0.1"></a>
## [6.0.1](https://bitbucket.org/atlassian/swagger-mock-validator/compare/6.0.0...6.0.1) (2019-02-27)


### Bug Fixes

* definitions no needed for parameter schema validation ([4a693d6](https://bitbucket.org/atlassian/swagger-mock-validator/commits/4a693d6))



<a name="6.0.0"></a>
# [6.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/5.2.1...6.0.0) (2019-02-05)


### Bug Fixes

* skip request and response body validation when the content-type is unknown ([d400a1e](https://bitbucket.org/atlassian/swagger-mock-validator/commits/d400a1e))


### Features

* add configurable object depth output to CLI ([ecfa0c0](https://bitbucket.org/atlassian/swagger-mock-validator/commits/ecfa0c0))


### BREAKING CHANGES

* Prior to this change the tool used to fail when a pact response body was validated against an unsupported swagger mime type. Now when an unsupported mime type is encountered request body validation is skipped. It is recommended that consumers and providers coordinate upgrading to this release so that both sides agree on what is considered valid vs invalid.



<a name="5.2.1"></a>
## [5.2.1](https://bitbucket.org/atlassian/swagger-mock-validator/compare/5.2.0...5.2.1) (2018-10-02)


### Bug Fixes

* validate wildcards for media types, drop buggy support for media type parameters ([602abbd](https://bitbucket.org/atlassian/swagger-mock-validator/commits/602abbd))



<a name="5.2.0"></a>
# [5.2.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/5.1.0...5.2.0) (2018-09-13)


### Features

* support basic auth when using Pact Broker ([be5e106](https://bitbucket.org/atlassian/swagger-mock-validator/commits/be5e106)), closes [#72](https://bitbucket.org/atlassian/swagger-mock-validator/issue/72)



<a name="5.1.0"></a>
# [5.1.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/5.0.1...5.1.0) (2018-09-06)


### Features

* support tagging when using Pact Broker ([f2ca58b](https://bitbucket.org/atlassian/swagger-mock-validator/commits/f2ca58b)), closes [#71](https://bitbucket.org/atlassian/swagger-mock-validator/issue/71)



<a name="5.0.1"></a>
## [5.0.1](https://bitbucket.org/atlassian/swagger-mock-validator/compare/5.0.0...5.0.1) (2018-08-29)


### Bug Fixes

* pin swagger-parser to avoid breaking changes when validation logic is changed ([ab6c04c](https://bitbucket.org/atlassian/swagger-mock-validator/commits/ab6c04c))



<a name="5.0.0"></a>
# [5.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/4.0.1...5.0.0) (2018-08-23)


### Bug Fixes

* do not crash if path-item contains an ^x- property ([d57f887](https://bitbucket.org/atlassian/swagger-mock-validator/commits/d57f887))
* fixed issue with format not being validated for bodies containing primitive values ([dca4654](https://bitbucket.org/atlassian/swagger-mock-validator/commits/dca4654))
* use case-sensitive matching for query string parameters ([f269cd9](https://bitbucket.org/atlassian/swagger-mock-validator/commits/f269cd9))


### Chores

* removed support for node version 4.x and added build test for node version 10.x ([52c4963](https://bitbucket.org/atlassian/swagger-mock-validator/commits/52c4963))


### Features

* add support for OpenApi 3 specs ([19deb93](https://bitbucket.org/atlassian/swagger-mock-validator/commits/19deb93))
* removed swagger warnings from validation results ([9a3b757](https://bitbucket.org/atlassian/swagger-mock-validator/commits/9a3b757))


### BREAKING CHANGES

* Removed support for node 4.x. Migrate to node 6.x or higher.
* Prior to this change swagger-mock-validator would return any pact/swagger warnings or errors as part of the validation result. Now when a validation error is encountered with a swagger or pact file the tool will fail with an error. Warnings are no longer reported at all. The list of validation result codes returned by the programatic API have been updated to reflect this change.



<a name="4.0.1"></a>
## [4.0.1](https://bitbucket.org/atlassian/swagger-mock-validator/compare/4.0.0...4.0.1) (2018-07-05)


### Bug Fixes

* paths without parameters not matching before paths with parameters ([b0f0f4e](https://bitbucket.org/atlassian/swagger-mock-validator/commits/b0f0f4e)), closes [#69](https://bitbucket.org/atlassian/swagger-mock-validator/issue/69)



<a name="4.0.0"></a>
# [4.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/3.0.0...4.0.0) (2018-04-13)


### Bug Fixes

* format validators for int32, int64, float and double no longer accept spaces and now test for the full range of accepted values ([a38b085](https://bitbucket.org/atlassian/swagger-mock-validator/commits/a38b085)), closes [#67](https://bitbucket.org/atlassian/swagger-mock-validator/issue/67)


### BREAKING CHANGES

* Prior to this change the tool used to accept blank spaces in path parameters for int32, int64, float and double formatted numbers. A bug has been fixed to disallow blank spaces. This means some mock responses that were previously considered valid will now be considered invalid. This change has also updated the int64 and double format validators to now test for the full range of values these types support. This means some mock responses that were previously considered invalid will now be considered valid.

It is recommended that consumers and providers coordinate upgrading to this release so that both sides agree on what is considered valid vs invalid.



<a name="3.0.0"></a>
# [3.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/2.2.3...3.0.0) (2018-01-31)


### Bug Fixes

* content negotiation between request content type header and consumes values in spec ([100aaf3](https://bitbucket.org/atlassian/swagger-mock-validator/commits/100aaf3))


### BREAKING CHANGES

* This release contains a bug fix for the way content type headers were being validated. As a result of this bug fix some mocks and specs which were previously considered valid will now be considered invalid.



<a name="2.2.3"></a>
## [2.2.3](https://bitbucket.org/atlassian/swagger-mock-validator/compare/2.2.2...2.2.3) (2017-12-21)


### Bug Fixes

* bump swagger-tools to resolve issue where the tool locks up when swagger examples contain a length property ([46dac30](https://bitbucket.org/atlassian/swagger-mock-validator/commits/46dac30))



<a name="2.2.2"></a>
## [2.2.2](https://bitbucket.org/atlassian/swagger-mock-validator/compare/2.2.1...2.2.2) (2017-11-29)


### Bug Fixes

* reverting fix for content negotiation, this will be re-released as a major version ([c72993f](https://bitbucket.org/atlassian/swagger-mock-validator/commits/c72993f))



<a name="2.2.1"></a>
## [2.2.1](https://bitbucket.org/atlassian/swagger-mock-validator/compare/2.2.0...2.2.1) (2017-11-29)


### Bug Fixes

* fix content negotiation between request content type header and consumes values in spec ([4953743](https://bitbucket.org/atlassian/swagger-mock-validator/commits/4953743))



<a name="2.2.0"></a>
# [2.2.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/2.1.0...2.2.0) (2017-09-01)


### Features

* add javascript api ([ea0f098](https://bitbucket.org/atlassian/swagger-mock-validator/commits/ea0f098))



<a name="2.1.0"></a>
# [2.1.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/2.0.2...v2.1.0) (2017-08-07)


### Features

* allow empty pact list to be returned from pact broker ([1eea0ee](https://bitbucket.org/atlassian/swagger-mock-validator/commits/1eea0ee)), closes [#63](https://bitbucket.org/atlassian/swagger-mock-validator/issue/63)



<a name="2.0.2"></a>
## [2.0.2](https://bitbucket.org/atlassian/swagger-mock-validator/compare/2.0.1...v2.0.2) (2017-07-14)


### Bug Fixes

* spec warnings were not shown if mock validation returns errors ([c1328a8](https://bitbucket.org/atlassian/swagger-mock-validator/commits/c1328a8))



<a name="2.0.0"></a>
# [2.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/1.0.0...v2.0.0) (2017-07-11)


### Bug Fixes

* allOf validation ignoring required properties and formats ([bae1bb7](https://bitbucket.org/atlassian/swagger-mock-validator/commits/bae1bb7)), closes [#32](https://bitbucket.org/atlassian/swagger-mock-validator/issue/32)


### Features

* add support for circular references in the swagger file ([dd61f7b](https://bitbucket.org/atlassian/swagger-mock-validator/commits/dd61f7b)), closes [#60](https://bitbucket.org/atlassian/swagger-mock-validator/issue/60)
* only output mockDetails and specDetails when they relevant ([8486bf8](https://bitbucket.org/atlassian/swagger-mock-validator/commits/8486bf8)), closes [#56](https://bitbucket.org/atlassian/swagger-mock-validator/issue/56)


### BREAKING CHANGES

* Prior to this change the tool used to disallow additional properties in response mocks unless the schema explicitly allowed additional properties. To support the allOf keyword correctly this behavior has been changed. Now additional properties are allowed in response mocks unless a schema explicitly disallows them. This means some mock responses that were previously considered invalid will now be considered valid. It is recommended that consumers and providers coordinate upgrading to this release so that both sides agree on what is considered valid vs invalid.
* swagger-mock-validator now supports validating schemas containing circular references. Prior to this change schemas containing circular references were ignored. If you have a schema that contains circular references and a mock that is not compatible with that schema the swagger-mock-validator will now fail. It is recommended that consumers and providers coordinate upgrading to this release so that both sides agree on what is considered valid vs invalid.



<a name="1.0.0"></a>
# [1.0.0](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.31...v1.0.0) (2017-03-24)


### Bug Fixes

* the order of security requirements impacts validation results ([07a7122](https://bitbucket.org/atlassian/swagger-mock-validator/commits/07a7122))


### Features

* add opt-in analytics ([6439444](https://bitbucket.org/atlassian/swagger-mock-validator/commits/6439444)), closes [#54](https://bitbucket.org/atlassian/swagger-mock-validator/issue/54)
* rename project to swagger-mock-validator ([2594491](https://bitbucket.org/atlassian/swagger-mock-validator/commits/2594491)), closes [#16](https://bitbucket.org/atlassian/swagger-mock-validator/issue/16)


### BREAKING CHANGES

* The name of the module has changed from “@atlassian/swagger-pact-validator” to “swagger-mock-validator”. To migrate you need to rename the dependency in your package.json and update any code that invokes this cli took from “swagger-pact-validator” to “swagger-mock-validator”.



<a name="0.0.31"></a>
## [0.0.31](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.30...v0.0.31) (2017-02-22)


### Features

* add breakdown of issues detected ([5c5075c](https://bitbucket.org/atlassian/swagger-mock-validator/commits/5c5075c)), closes [#39](https://bitbucket.org/atlassian/swagger-mock-validator/issue/39)



<a name="0.0.30"></a>
## [0.0.30](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.28...v0.0.30) (2017-02-20)


### Features

* add support for swagger base path ([1f9828c](https://bitbucket.org/atlassian/swagger-mock-validator/commits/1f9828c)), closes [#24](https://bitbucket.org/atlassian/swagger-mock-validator/issue/24)



<a name="0.0.28"></a>
## [0.0.28](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.27...v0.0.28) (2017-02-16)


### Features

* add support for yaml swagger files ([fabbe62](https://bitbucket.org/atlassian/swagger-mock-validator/commits/fabbe62)), closes [#20](https://bitbucket.org/atlassian/swagger-mock-validator/issue/20)



<a name="0.0.27"></a>
## [0.0.27](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.26...v0.0.27) (2017-02-08)


### Features

* add validation for auth headers ([a9cd312](https://bitbucket.org/atlassian/swagger-mock-validator/commits/a9cd312)), closes [#53](https://bitbucket.org/atlassian/swagger-mock-validator/issue/53)



<a name="0.0.26"></a>
## [0.0.26](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.25...v0.0.26) (2017-01-24)


### Features

* add validation for response content type ([1a2d1fd](https://bitbucket.org/atlassian/swagger-mock-validator/commits/1a2d1fd)), closes [#52](https://bitbucket.org/atlassian/swagger-mock-validator/issue/52)



<a name="0.0.25"></a>
## [0.0.25](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.24...v0.0.25) (2017-01-23)


### Features

* add validation for swagger consumes ([660c618](https://bitbucket.org/atlassian/swagger-mock-validator/commits/660c618)), closes [#34](https://bitbucket.org/atlassian/swagger-mock-validator/issue/34)
* add validation for swagger produces ([2a341ab](https://bitbucket.org/atlassian/swagger-mock-validator/commits/2a341ab)), closes [#33](https://bitbucket.org/atlassian/swagger-mock-validator/issue/33)



<a name="0.0.24"></a>
## [0.0.24](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.23...v0.0.24) (2017-01-17)


### Bug Fixes

* correctly extract provider state from pact interactions ([d4dd4fe](https://bitbucket.org/atlassian/swagger-mock-validator/commits/d4dd4fe))



<a name="0.0.23"></a>
## [0.0.23](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.22...v0.0.23) (2017-01-16)


### Features

* add validation for query parameters ([774cef3](https://bitbucket.org/atlassian/swagger-mock-validator/commits/774cef3)), closes [#8](https://bitbucket.org/atlassian/swagger-mock-validator/issue/8)



<a name="0.0.22"></a>
## [0.0.22](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.21...v0.0.22) (2017-01-12)


### Features

* add pact broker support ([b2e1deb](https://bitbucket.org/atlassian/swagger-mock-validator/commits/b2e1deb)), closes [#10](https://bitbucket.org/atlassian/swagger-mock-validator/issue/10)



<a name="0.0.21"></a>
## [0.0.21](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.20...v0.0.21) (2017-01-06)


### Features

* add validation for additional property schemas ([e4967b9](https://bitbucket.org/atlassian/swagger-mock-validator/commits/e4967b9)), closes [#35](https://bitbucket.org/atlassian/swagger-mock-validator/issue/35)



<a name="0.0.20"></a>
## [0.0.20](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.19...v0.0.20) (2017-01-04)


### Bug Fixes

* remove default parameters for node 4.x compatibility ([ddbdb45](https://bitbucket.org/atlassian/swagger-mock-validator/commits/ddbdb45)), closes [#50](https://bitbucket.org/atlassian/swagger-mock-validator/issue/50)



<a name="0.0.19"></a>
## [0.0.19](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.18...v0.0.19) (2017-01-03)


### Features

* add validation for type array ([96b44a9](https://bitbucket.org/atlassian/swagger-mock-validator/commits/96b44a9)), closes [#49](https://bitbucket.org/atlassian/swagger-mock-validator/issue/49)



<a name="0.0.18"></a>
## [0.0.18](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.17...v0.0.18) (2016-12-30)


### Features

* add validation for enum ([e83600e](https://bitbucket.org/atlassian/swagger-mock-validator/commits/e83600e)), closes [#40](https://bitbucket.org/atlassian/swagger-mock-validator/issue/40)
* add validation for maximum and exclusiveMaximum ([8371cc2](https://bitbucket.org/atlassian/swagger-mock-validator/commits/8371cc2)), closes [#41](https://bitbucket.org/atlassian/swagger-mock-validator/issue/41)
* add validation for maxLength and minLength ([8aa82e8](https://bitbucket.org/atlassian/swagger-mock-validator/commits/8aa82e8)), closes [#45](https://bitbucket.org/atlassian/swagger-mock-validator/issue/45) [#46](https://bitbucket.org/atlassian/swagger-mock-validator/issue/46)
* add validation for minimum and exclusiveMinimum ([11e7eba](https://bitbucket.org/atlassian/swagger-mock-validator/commits/11e7eba)), closes [#43](https://bitbucket.org/atlassian/swagger-mock-validator/issue/43)
* add validation for multipleOf ([bfe149e](https://bitbucket.org/atlassian/swagger-mock-validator/commits/bfe149e)), closes [#48](https://bitbucket.org/atlassian/swagger-mock-validator/issue/48)
* add validation for pattern ([d20251e](https://bitbucket.org/atlassian/swagger-mock-validator/commits/d20251e)), closes [#47](https://bitbucket.org/atlassian/swagger-mock-validator/issue/47)



<a name="0.0.17"></a>
## [0.0.17](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.16...v0.0.17) (2016-12-29)


### Features

* add validation for swagger formats ([5bab1fd](https://bitbucket.org/atlassian/swagger-mock-validator/commits/5bab1fd)), closes [#29](https://bitbucket.org/atlassian/swagger-mock-validator/issue/29)



<a name="0.0.16"></a>
## [0.0.16](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.15...v0.0.16) (2016-12-19)


### Features

* add counts of errors and warnings detected ([0846030](https://bitbucket.org/atlassian/swagger-mock-validator/commits/0846030)), closes [#38](https://bitbucket.org/atlassian/swagger-mock-validator/issue/38)
* add validation for response headers ([2218cb3](https://bitbucket.org/atlassian/swagger-mock-validator/commits/2218cb3)), closes [#5](https://bitbucket.org/atlassian/swagger-mock-validator/issue/5)



<a name="0.0.15"></a>
## [0.0.15](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.14...v0.0.15) (2016-12-14)


### Features

* display warnings when validation succeeds ([1be61b5](https://bitbucket.org/atlassian/swagger-mock-validator/commits/1be61b5))



<a name="0.0.14"></a>
## [0.0.14](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.13...v0.0.14) (2016-12-14)


### Features

* add validation for request headers ([2676b27](https://bitbucket.org/atlassian/swagger-mock-validator/commits/2676b27)), closes [#2](https://bitbucket.org/atlassian/swagger-mock-validator/issue/2) [#7](https://bitbucket.org/atlassian/swagger-mock-validator/issue/7)
* undefined non-standard request headers are now warnings ([adca8bd](https://bitbucket.org/atlassian/swagger-mock-validator/commits/adca8bd))



<a name="0.0.13"></a>
## [0.0.13](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.12...v0.0.13) (2016-12-07)


### Features

* add support for default swagger responses ([a391c8b](https://bitbucket.org/atlassian/swagger-mock-validator/commits/a391c8b)), closes [#30](https://bitbucket.org/atlassian/swagger-mock-validator/issue/30)



<a name="0.0.12"></a>
## [0.0.12](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.11...v0.0.12) (2016-12-05)


### Features

* add validation for response body ([ac2c479](https://bitbucket.org/atlassian/swagger-mock-validator/commits/ac2c479)), closes [#6](https://bitbucket.org/atlassian/swagger-mock-validator/issue/6)
* reduce verbosity of the output when errors are detected ([d300546](https://bitbucket.org/atlassian/swagger-mock-validator/commits/d300546)), closes [#27](https://bitbucket.org/atlassian/swagger-mock-validator/issue/27)



<a name="0.0.11"></a>
## [0.0.11](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.10...v0.0.11) (2016-11-30)


### Features

* add validation for response status ([6a1feec](https://bitbucket.org/atlassian/swagger-mock-validator/commits/6a1feec)), closes [#4](https://bitbucket.org/atlassian/swagger-mock-validator/issue/4)


### Performance Improvements

* improve validation speed for large swagger files ([e009399](https://bitbucket.org/atlassian/swagger-mock-validator/commits/e009399))



<a name="0.0.10"></a>
## [0.0.10](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.9...v0.0.10) (2016-11-24)


### Features

* add validation for json request bodies ([7dfb267](https://bitbucket.org/atlassian/swagger-mock-validator/commits/7dfb267)), closes [#22](https://bitbucket.org/atlassian/swagger-mock-validator/issue/22)



<a name="0.0.9"></a>
## [0.0.9](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.8...v0.0.9) (2016-11-21)


### Bug Fixes

* partial path matching causing exceptions ([8507ff5](https://bitbucket.org/atlassian/swagger-mock-validator/commits/8507ff5))



<a name="0.0.8"></a>
## [0.0.8](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.7...v0.0.8) (2016-11-18)


### Bug Fixes

* swagger validation warnings treated as warnings not errors ([ccf7251](https://bitbucket.org/atlassian/swagger-mock-validator/commits/ccf7251)), closes [#21](https://bitbucket.org/atlassian/swagger-mock-validator/issue/21) [#19](https://bitbucket.org/atlassian/swagger-mock-validator/issue/19)



<a name="0.0.7"></a>
## [0.0.7](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.6...v0.0.7) (2016-11-17)


### Bug Fixes

* handle undefined path parameters when method is missing ([b595073](https://bitbucket.org/atlassian/swagger-mock-validator/commits/b595073))



<a name="0.0.6"></a>
## [0.0.6](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.5...v0.0.6) (2016-11-17)


### Features

* add validation for request methods ([778b8e0](https://bitbucket.org/atlassian/swagger-mock-validator/commits/778b8e0)), closes [#3](https://bitbucket.org/atlassian/swagger-mock-validator/issue/3)



<a name="0.0.5"></a>
## [0.0.5](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.4...v0.0.5) (2016-11-08)



<a name="0.0.4"></a>
## [0.0.4](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.3...v0.0.4) (2016-09-13)


### Features

* add support for retrieving pact and swagger files via urls ([ab248dc](https://bitbucket.org/atlassian/swagger-mock-validator/commits/ab248dc))



<a name="0.0.3"></a>
## [0.0.3](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.2...v0.0.3) (2016-09-01)


### Bug Fixes

* path parameter parser no longer case sensitive for request method ([cab9c81](https://bitbucket.org/atlassian/swagger-mock-validator/commits/cab9c81))



<a name="0.0.2"></a>
## [0.0.2](https://bitbucket.org/atlassian/swagger-mock-validator/compare/0.0.1...v0.0.2) (2016-08-24)


### Features

* add validation for request paths ([d95aa8f](https://bitbucket.org/atlassian/swagger-mock-validator/commits/d95aa8f)), closes [#1](https://bitbucket.org/atlassian/swagger-mock-validator/issue/1)



