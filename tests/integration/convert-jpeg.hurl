# POST JPEG
POST http://localhost:8080/v1/fragments
Content-Type: image/jpeg
[BasicAuth]
user1@email.com:password1

file,files/file.jpeg;

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

# Convert to WEBP
GET {{url}}.webp
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
[Asserts]
header "Content-Type" contains "image/webp"
