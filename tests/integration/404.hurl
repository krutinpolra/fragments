# 404 Not Found Test
GET http://localhost:8080/no-such-route

# We should get back a non-cacheable response (cache-control header)
Cache-Control: no-cache

# We should get back an HTTP 1.1 404 response
HTTP/1.1 404
Content-Type: application/json; charset=utf-8

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "not found"
