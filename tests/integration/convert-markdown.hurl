# POST markdown
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
file,files/file.md;

HTTP/1.1 201
[Captures]
url: header "Location"

# Convert to HTML
GET {{url}}.html
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200

# Convert to TXT
GET {{url}}.txt
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200
