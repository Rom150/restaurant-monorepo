# Mock Parse Server

A robust mock PDF parsing server for local development. Handles PDF parsing with graceful fallbacks and clear error messages.

## Features

- Robust pdf-parse loading that handles different export shapes
- Heuristic parsing to extract ingredients from PDF text
- Clear error messages for debugging
- Fallback responses for non-PDF files
- CORS enabled for frontend development

## Installation

```bash
cd tools/mock-parse-server
npm install
```

## Usage

### Start the server

```bash
npm start
```

The server will start on `http://localhost:9000` (or the port specified in `PORT` environment variable).

### Test with curl

```bash
# Test with a PDF file
curl -i -F "file=@../../frontend/mercuriale_example.pdf" http://localhost:9000/parse

# Test with the provided test script
npm run test-parse
```

### Test script

A bash test script is provided for convenience:

```bash
./test-parse.sh
```

This script will:
1. POST a PDF file to the parse endpoint
2. Display the server response
3. Tail the mock-parse-server.log for debugging

## API

### POST /parse

Accepts a multipart form file upload with field name `file`.

**Request:**
```bash
curl -F "file=@path/to/file.pdf" http://localhost:9000/parse
```

**Response (Success):**
```json
{
  "meta": {
    "fileName": "mercuriale_example.pdf",
    "source": "server"
  },
  "items": [
    {
      "name": "Farine",
      "quantite": 10,
      "unite": "kg",
      "prix": 2.50
    }
  ]
}
```

**Response (No items found):**
```json
{
  "meta": {
    "fileName": "mercuriale_example.pdf",
    "source": "server",
    "parsed": false
  },
  "items": []
}
```

**Response (Error):**
```json
{
  "error": "parse error",
  "detail": "pdf-parse function not available"
}
```

## Debugging

The server logs parsing activity to the console. Check the logs for:
- File upload information
- PDF parsing status
- Error details

## Development Notes

- The server uses heuristic regex patterns to extract ingredients from PDF text
- Patterns are conservative and return `parsed: false` when no reliable items are found
- For non-PDF files, returns a small deterministic fallback to help frontend development
- The frontend should implement client-side fallback for cases where server parsing fails
