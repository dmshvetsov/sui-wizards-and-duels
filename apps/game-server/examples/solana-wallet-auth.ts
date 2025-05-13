// Function to generate a Sign-In with Solana message
function generateSolanaSignMessage(address: string, nonce: string): string {
  const domain = window.location.host;
  const origin = window.location.origin;
  
  return `${domain} wants you to sign in with your Solana account:
${address}

I accept the Terms of Service: ${origin}/tos

URI: ${origin}
Version: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;
}

// Function to authenticate with Solana wallet
async function signInWithSolana() {
  try {
    // Check if Phantom wallet is installed
    const phantom = window.phantom?.solana;
    if (!phantom) {
      throw new Error("Phantom wallet is not installed");
    }

    // Connect to the wallet
    const { publicKey } = await phantom.connect();
    const walletAddress = publicKey.toString();

    // Generate a random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    
    // Create the message to sign
    const message = generateSolanaSignMessage(walletAddress, nonce);
    
    // Request signature from the user
    const encodedMessage = new TextEncoder().encode(message);
    const { signature } = await phantom.signMessage(encodedMessage, 'utf8');
    
    // Convert the signature to base58
    const signatureBase58 = bs58.encode(signature);
    
    // Send the signature to your backend for verification
    const response = await fetch('https://your-project.supabase.co/functions/v1/wallet-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        signature: signatureBase58,
        message,
        chain: 'solana'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }
    
    const { token, user } = await response.json();
    
    // Store the token in localStorage or a secure cookie
    localStorage.setItem('authToken', token);
    
    return { token, user };
  } catch (error) {
    console.error('Error signing in with Solana:', error);
    throw error;
  }
}