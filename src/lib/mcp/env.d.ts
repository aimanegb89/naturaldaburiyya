// The MCP tool files below are bundled by mcpPlugin() into a Deno Edge Function
// where `process.env.*` is provided at runtime. Declare it for the Vite tsc pass.
declare const process: { env: Record<string, string | undefined> };
