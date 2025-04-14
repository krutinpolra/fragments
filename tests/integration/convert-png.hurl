# POST PNG
POST http://localhost:8080/v1/fragments
Content-Type: image/png
[BasicAuth]
user1@email.com:password1

file,files/file.png;

HTTP/1.1 201

[Captures]
url: header "Location"

# Convert to JPEG
GET {{url}}.jpg
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
[Asserts]
header "Content-Type" contains "image/jpeg"

# Convert to WebP
GET {{url}}.webp
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
[Asserts]
header "Content-Type" contains "image/webp"
