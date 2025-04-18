# Fragments - Back-End API

Fragments is a Node.js-based REST API created using Express, designed for cloud-based development and structured logging.

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (LTS version recommended)
- **npm**
- **VSCode**
- **Git**

### Installation

1. Clone the repository:

```bash
git clone git@github.com:krutinpolra/fragments.git
cd fragments
```

2. Install dependencies:

```bash
npm install
```

### Scripts

1. Lint the Code

- Run ESLint to identify and fix issues in your code:

```bash
npm run lint
```

2. Start the Server

- Start the server normally:

```bash
npm start
```

3. Run in Development Mode

- Start the server with nodemon to watch for changes and reload automatically:

```bash
npm run dev
```

4. Debug the Server

- Run the server in debug mode, allowing you to attach a debugger:

```bash
npm run debug
```

## Debugging

### Using VSCode Debugger

1. Start the server in debug mode:

```bash
npm run debug
```

2. Open the Run and Debug panel in VSCode (Ctrl+Shift+D or click the debug icon).

3. Select the Debug via npm run debug configuration and click the Start Debugging button.

4. Add breakpoints in your code (e.g., in src/app.js) and inspect variables as the debugger pauses execution.

## Tools and Extensions

### Recommended VSCode Extensions

- Prettier - Code Formatter: Automatically formats your code on save.
- ESLint: Highlights and fixes linting issues.

### Useful Command-Line Tools

- curl: Test HTTP endpoints.
- jq: Pretty-print JSON responses.

## Testing the Server

### Health Check Endpoint

- Health Check Endpoint

```bash
curl.exe localhost:8080 //for windows
```

- Expected response:

```json
{
  "status": "ok",
  "author": "Krutin Polra",
  "githubUrl": "https://github.com/krutinpolra/fragments.git",
  "version": "0.0.1"
}
```

### Headers Validation

- To validate HTTP headers, use:

```bash
curl.exe -i localhost:8080
```

## Notes

- will add as I progress through
