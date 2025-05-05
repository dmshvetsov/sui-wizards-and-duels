import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

// This function will be scheduled to run every 30 seconds
Deno.cron("Pair waitroom users", "*/30 * * * * *", async () => {
  try {
    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    // Create Supabase client with the service role key for admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the waitroom-pairing function
    const response = await fetch(`${supabaseUrl}/functions/v1/waitroom-pairing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error calling waitroom-pairing function:', errorData);
      return;
    }

    const result = await response.json();
    console.log('Pairing result:', result);
  } catch (error) {
    console.error('Unexpected error in cron job:', error);
  }
});
