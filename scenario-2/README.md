this below snippet is from swagger file


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

below snippet is from pact file


```
        "query": {
          "old_amount": [
            "2587"
          ],
          "new_amount": [
            "ABC2587"
          ],
```

this is a success because the type is string
