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
    "Place an order for the signed-in user. Saves the order and its items to their account so it appears in their order history (list_my_orders) even after sign-out. The shop confirms and fulfills orders via WhatsApp. Provide either a saved address_id or a new delivery address (street + city).",
  inputSchema: {
    items: z
      .array(
        z.object({
          product_id: z.string().min(1).describe("Product ID."),
          product_name: z.string().min(1).describe("Product display name (English)."),
          size: z.enum(["small", "large"]).describe("small = 350ml, large = 500ml."),
          quantity: z.number().int().min(1),
          price: z.number().min(0).describe("Unit price in ILS."),
        }),
      )
      .min(1)
      .describe("Line items to order."),
    address_id: z
      .string()
      .uuid()
      .optional()
      .describe("ID of a saved address belonging to the user. If omitted, street and city are required."),
    street: z.string().optional().describe("Street for a new delivery address."),
    city: z.string().optional().describe("City for a new delivery address."),
    postal_code: z.string().optional().describe("Postal code for a new delivery address."),
    phone: z.string().optional().describe("Contact phone number."),
    notes: z.string().optional().describe("Order notes for the shop."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ items, address_id, street, city, postal_code, phone, notes }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    let finalAddressId: string | null = address_id ?? null;

    if (!finalAddressId) {
      if (!street || !city) {
        return {
          content: [{ type: "text", text: "Provide address_id, or street and city for a new address." }],
          isError: true,
        };
      }
      const { data: addr, error: addrError } = await supabase
        .from("addresses")
        .insert({
          user_id: userId,
          label: "Delivery address",
          street,
          city,
          postal_code: postal_code ?? null,
          phone: phone ?? null,
        })
        .select("id")
        .single();
      if (addrError) {
        return { content: [{ type: "text", text: addrError.message }], isError: true };
      }
      finalAddressId = addr.id;
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        address_id: finalAddressId,
        total_amount: total,
        status: "pending",
        notes: notes ?? null,
      })
      .select("id, status, total_amount, created_at")
      .single();
    if (orderError) {
      return { content: [{ type: "text", text: orderError.message }], isError: true };
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
      })),
    );
    if (itemsError) {
      return { content: [{ type: "text", text: itemsError.message }], isError: true };
    }

    return {
      content: [
        {
          type: "text",
          text: `Order ${order.id} created (total ₪${total}). The shop will confirm via WhatsApp.`,
        },
      ],
      structuredContent: { order: { ...order, items } },
    };
  },
});
