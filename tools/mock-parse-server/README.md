# Mock Parse Server (dev)

This small server accepts file uploads (field name `file`) on `POST /parse` and returns JSON parsed results (or `{ meta: { parsed: false }, items: [] }` if nothing found).

Setup:
1. cd tools/mock-parse-server
2. npm install
3. npm start

Test:
- curl -F "file=@../../frontend/mercuriale_example.pdf" http://localhost:9000/parse

Notes:
- The server will try to resolve `pdf-parse` whatever its module shape (default export vs function).
- If pdf-parse cannot be resolved at runtime, the server returns 500 with detail "pdf-parse function not available".
