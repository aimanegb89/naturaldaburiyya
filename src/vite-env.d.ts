/// <reference types="vite/client" />

// MCP tool files (src/lib/mcp/**) are bundled by mcpPlugin() into a Deno Edge
// Function where `process.env.*` is provided at runtime. Declare it globally
// so the Vite TypeScript pass accepts these references.
declare const process: { env: Record<string, string | undefined> };
