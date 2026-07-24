import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "remove_favorite",
  title: "Remove favorite product",
  description: "Remove a product from the signed-in user's favorites.",
  inputSchema: {
    product_id: z.string().min(1).describe("Product ID to unfavorite."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ product_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { error } = await supabaseForUser(ctx)
      .from("favorites")
      .delete()
      .eq("user_id", ctx.getUserId())
      .eq("product_id", product_id);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Removed ${product_id}` }],
      structuredContent: { removed: product_id },
    };
  },
});
