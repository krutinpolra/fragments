# POST WebP
POST http://localhost:8080/v1/fragments
Content-Type: image/webp
[BasicAuth]
user1@email.com:password1

file,files/file.webp;

HTTP/1.1 201

[Captures]
url: header "Location"

# Convert to PNG
GET {{url}}.png
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
[Asserts]
header "Content-Type" contains "image/png"

# Convert to JPEG
GET {{url}}.jpg
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
[Asserts]
header "Content-Type" contains "image/jpeg"
