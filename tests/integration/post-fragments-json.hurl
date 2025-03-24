# tests/integration/post-fragments-json.hurl
# POST a JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

`{"msg": "hello world"}`

HTTP/1.1 201
[Captures]
url: header "Location"

# GET the JSON fragment to ensure the response matches the posted data
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^application/json(; charset=utf-8)?$"
body == "{\"msg\": \"hello world\"}"
