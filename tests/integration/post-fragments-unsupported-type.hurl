# tests/integration/post-fragments-unsupported-type.hurl
# POST fragment with an unsupported Content-Type (application/xml)
POST http://localhost:8080/v1/fragments
Content-Type: application/xml
[BasicAuth]
user1@email.com:password1

`<note><to>User</to><from>Admin</from></note>`

# We expect a 415 Unsupported Media Type
HTTP/1.1 415
[Asserts]
jsonpath "$.error.code" == 415
jsonpath "$.error.message" isString
