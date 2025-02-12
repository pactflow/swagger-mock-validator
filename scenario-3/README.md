this below snippet is from swagger file

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

this below snippet is from pact file

```
        "query": {
          "old_amount": [
            "2587"
          ],
          "new_amount": [
            "ABC2587"
          ],
```

the result will be failure because coercsion doesn't work
