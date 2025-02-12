this is from swagger.json
```
          {
            "name": "new_amount",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
```

in the above snippet in swagger.json 

the pact file contains the below snippets

query
```
        "query": {
          "old_amount": [
            "2587"
          ],
          "new_amount": [
            "2587"
          ],
```
matching rules
```
        "matchingRules": {
          "$.query.new_amount": {
            "match": "type"
          }
        }
```

the result is a success


