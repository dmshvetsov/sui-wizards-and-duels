const corsHeadersCommon = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = Deno.env.get('APP_URL')

export const corsHeaders = APP_URL
  ? {
      ...corsHeadersCommon,
      'Access-Control-Allow-Origin': APP_URL,
    }
  : {
      ...corsHeadersCommon,
    }
