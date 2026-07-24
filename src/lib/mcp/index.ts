import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listMyOrders from "./tools/list-my-orders";
import listMyFavorites from "./tools/list-my-favorites";
import addFavorite from "./tools/add-favorite";
import removeFavorite from "./tools/remove-favorite";

// Issuer MUST be the direct Supabase host, built from the project ref (never SUPABASE_URL).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "natural-mcp",
  title: "Natural — Healthy Drinks & Supplements",
  version: "0.1.0",
  instructions:
    "Tools for the Natural shop. Read the signed-in user's profile, orders, and favorites, and add or remove favorites. Each user connects as themselves via OAuth.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, listMyOrders, listMyFavorites, addFavorite, removeFavorite],
});
