import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to set the custom JWT in Supabase
async function setSupabaseSession(token: string) {
  const { data, error } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: '' // Not using refresh tokens with wallet auth
  });
  
  if (error) {
    console.error('Error setting Supabase session:', error);
    throw error;
  }
  
  return data;
}

// Function to sign out
async function signOut() {
  localStorage.removeItem('authToken');
  await supabase.auth.signOut();
}

// Function to check if user is authenticated
async function isAuthenticated() {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  try {
    // Verify the token is still valid
    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data.user;
  } catch {
    return false;
  }
}

// Example usage
async function authenticateWithWallet(walletType: 'ethereum' | 'solana') {
  try {
    let authResult;
    
    if (walletType === 'ethereum') {
      authResult = await signInWithEthereum();
    } else {
      authResult = await signInWithSolana();
    }
    
    // Set the session in Supabase
    await setSupabaseSession(authResult.token);
    
    console.log('Successfully authenticated with wallet');
    return authResult.user;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}