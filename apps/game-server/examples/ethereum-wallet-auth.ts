import { ethers } from 'ethers';

// Function to generate a Sign-In with Ethereum message (EIP-4361)
function generateEIP4361Message(address: string, nonce: string): string {
  const domain = window.location.host;
  const origin = window.location.origin;
  
  return `${domain} wants you to sign in with your Ethereum account:
${address}

I accept the Terms of Service: ${origin}/tos

URI: ${origin}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;
}

// Function to authenticate with Ethereum wallet
async function signInWithEthereum() {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const walletAddress = accounts[0];

    // Generate a random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    
    // Create the message to sign
    const message = generateEIP4361Message(walletAddress, nonce);
    
    // Request signature from the user
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    
    // Send the signature to your backend for verification
    const response = await fetch('https://your-project.supabase.co/functions/v1/wallet-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        signature,
        message,
        chain: 'ethereum'
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
    console.error('Error signing in with Ethereum:', error);
    throw error;
  }
}