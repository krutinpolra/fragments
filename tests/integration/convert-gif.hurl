# Convert GIF → PNG
POST http://localhost:8080/v1/fragments
Content-Type: image/gif
[BasicAuth]
user1@email.com:password1

file,files/file.gif;

HTTP/1.1 201
[Captures]
url: header "Location"

GET {{url}}.png
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200

[Asserts]
header "Content-Type" == "image/png"
