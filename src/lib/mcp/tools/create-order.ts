declare const process: { env: Record<string, string | undefined> };

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
  name: "create_order",
  title: "Create order",
  description:
    "Place an order for the signed-in user. Prices are calculated by the shop, not the caller. The order appears in list_my_orders and the shop managers are notified. Provide a saved address_id or a new delivery address (street + city). name and phone default to the user's profile.",
  inputSchema: {
    items: z
      .array(
        z.object({
          product_id: z.string().min(1).max(80).describe("Product ID."),
          size: z.enum(["small", "large"]).describe("small = 350ml, large = 500ml."),
          quantity: z.number().int().min(1).max(50),
        }),
      )
      .min(1)
      .max(50)
      .describe("Line items to order."),
    address_id: z.string().uuid().optional().describe("ID of a saved address belonging to the user."),
    street: z.string().max(200).optional().describe("Street for a new delivery address."),
    city: z.string().max(100).optional().describe("City for a new delivery address."),
    postal_code: z.string().max(20).optional().describe("Postal code."),
    name: z.string().max(100).optional().describe("Customer name (defaults to profile)."),
    phone: z.string().max(20).optional().describe("Contact phone (defaults to profile)."),
    notes: z.string().max(500).optional().describe("Order notes for the shop."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ items, address_id, street, city, postal_code, name, phone, notes }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle();

    let s = street, c = city, pc = postal_code, ph = phone;
    if (address_id) {
      const { data: a } = await supabase.from("addresses").select("street, city, postal_code, phone").eq("id", address_id).maybeSingle();
      if (!a) return { content: [{ type: "text", text: "Address not found." }], isError: true };
      s = a.street; c = a.city; pc = a.postal_code ?? undefined; ph = ph ?? a.phone ?? undefined;
    }
    const finalName = name ?? profile?.full_name ?? undefined;
    const finalPhone = ph ?? profile?.phone ?? undefined;
    if (!s || !c) return { content: [{ type: "text", text: "Provide address_id, or street and city." }], isError: true };
    if (!finalName || !finalPhone) return { content: [{ type: "text", text: "name and phone are required (not found on profile)." }], isError: true };

    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/place-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${ctx.getToken()}`,
      },
      body: JSON.stringify({
        name: finalName, phone: finalPhone, street: s, city: c, postal: pc ?? "", notes: notes ?? "",
        address_id: address_id ?? null, save_address: !address_id,
        idempotency_key: crypto.randomUUID(),
        items: items.map((i) => ({ id: i.product_id, size: i.size, quantity: i.quantity })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      return { content: [{ type: "text", text: `Order failed: ${data.error ?? res.status}${data.product_id ? ` (${data.product_id})` : ""}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Order #${data.order_number} placed (total ₪${data.total}). Tracking code ${data.tracking_code}.` }],
      structuredContent: { order: data },
    };
  },
});
