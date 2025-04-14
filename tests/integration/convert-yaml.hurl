# POST YAML
POST http://localhost:8080/v1/fragments
Content-Type: application/yaml
[BasicAuth]
user1@email.com:password1

```
name: Krutin
language: JavaScript
```

HTTP/1.1 201

[Captures]
url: header "Location"

# Convert to Plain Text
GET {{url}}.txt
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
[Asserts]
header "Content-Type" contains "text/plain"
