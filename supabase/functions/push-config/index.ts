import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Serves the public Firebase web-push config (these values are public by design).
Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const body = {
    apiKey: Deno.env.get('FIREBASE_MESSAGING_WEB_API_KEY') ?? '',
    projectId: Deno.env.get('FIREBASE_MESSAGING_PROJECT_ID') ?? '',
    appId: Deno.env.get('FIREBASE_MESSAGING_APP_ID') ?? '',
    vapidKey: Deno.env.get('FIREBASE_MESSAGING_VAPID_KEY') ?? '',
  };
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
