# POST JSON
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

`{"student1":"Krutin","student2":"Polra"}`

HTTP/1.1 201

[Captures]
url: header "Location"

# Convert to YAML
GET {{url}}.yaml
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
[Asserts]
header "Content-Type" contains "application/yaml"

# Convert to TXT
GET {{url}}.txt
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
[Asserts]
header "Content-Type" contains "text/plain"
