# POST HTML
POST http://localhost:8080/v1/fragments
Content-Type: text/html
[BasicAuth]
user1@email.com:password1

`<h1>Hello World</h1>`

HTTP/1.1 201

[Captures]
url: header "Location"

[Asserts]
header "Location" matches "^http://localhost:8080/v1/fragments/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/html"
jsonpath "$.fragment.size" > 0

# Convert to text
GET {{url}}.txt
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
header "Content-Type" contains "text/plain"
