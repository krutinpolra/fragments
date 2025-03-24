# tests/integration/post-fragments-unauthenticated.hurl
# POST fragment without authentication
POST http://localhost:8080/v1/fragments
Content-Type: text/plain

`Unauthenticated fragment`

# Should return 401 Unauthorized
HTTP/1.1 401
[Asserts]
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
