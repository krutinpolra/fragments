# POST CSV
POST http://localhost:8080/v1/fragments
Content-Type: text/csv
[BasicAuth]
user1@email.com:password1

```
Student,marks1,marks2
Student1,32,63
Student2,83,62
Student3,29,30
```
HTTP/1.1 201

[Captures]
url: header "Location"

[Asserts]
header "Location" matches "^http://localhost:8080/v1/fragments/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/csv"
jsonpath "$.fragment.size" > 0

# Convert CSV to JSON
GET {{url}}.json
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$[0].Student" == "Student1"
jsonpath "$[1].marks1" == "83"
jsonpath "$[2].marks2" == "30"
