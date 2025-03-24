# tests/integration/post-fragments-charset.hurl

# POST fragment with charset in Content-Type
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1

`This is a fragment with charset`

HTTP/1.1 201
[Captures]
url: header "Location"

# GET the same fragment to ensure charset is ignored but type is stored as 'text/plain'
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^text/plain(; charset=utf-8)?$"
body == "This is a fragment with charset"
