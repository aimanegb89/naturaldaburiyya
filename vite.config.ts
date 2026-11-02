import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// Public backend values (safe to ship; RLS protects data). Fallback for builds where .env is absent.
const SUPABASE_URL_FALLBACK = "https://elsopdxvwyxvrbpdozng.supabase.co";
const SUPABASE_KEY_FALLBACK =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsc29wZHh2d3l4dnJicGRvem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjc1OTksImV4cCI6MjA4NDc0MzU5OX0.w6wkAQ2CXxLpBdl0TCAFskfVVRBF9ArJOvEzdKICqDc";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_KEY_FALLBACK),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(process.env.VITE_SUPABASE_PROJECT_ID || "elsopdxvwyxvrbpdozng"),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mcpPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
