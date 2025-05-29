export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL'),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
