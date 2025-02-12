this below snippet is from swagger

```

          {
            "name": "new_amount",
            "in": "query",
            "required": true,
            "schema": {
              "type": "number"
            }
          },
```

the below snippet is from pact

```
        "query": {
          "old_amount": [
            "2587"
          ],
          "new_amount": [
            "2587"
          ],
```

the result will be success because the type is number and is also coerceable
