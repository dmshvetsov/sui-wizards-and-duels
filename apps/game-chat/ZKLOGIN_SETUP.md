# Setting up zkLogin with Enoki

This guide explains how to set up zkLogin authentication using Enoki in the Wizards and Duels game-chat app.

## Prerequisites

1. An Enoki account - Sign up at [Enoki Developer Portal](https://portal.enoki.mystenlabs.com)
2. OAuth credentials from identity providers (e.g., Google, Facebook, etc.)

## Step 1: Create an Enoki Project

1. Log in to the [Enoki Developer Portal](https://portal.enoki.mystenlabs.com)
2. Create a new project or use an existing one
3. Note your project ID for later use

## Step 2: Create API Keys

1. In your Enoki project dashboard, navigate to the "API Keys" section
2. Create a new public API key with the following settings:
   - Enable zkLogin
   - Select the networks you want to support
3. Copy the API key value

## Step 3: Configure OAuth Providers

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Set the application type to "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (for local development)
   - Your production domain (if applicable)
7. Add authorized redirect URIs:
   - `http://localhost:5173` (for local development)
   - Your production domain (if applicable)
8. Create the client ID and note the client ID value

### Add Provider to Enoki

1. In your Enoki project dashboard, navigate to the "Auth Providers" section
2. Add Google as a provider
3. Enter the Google Client ID you obtained in the previous step

## Step 4: Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```
   cp .env.example .env.local
   ```

2. Update the following variables in your `.env.local` file:
   ```
   VITE_ENOKI_API_KEY=your_enoki_api_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

## Testing zkLogin

1. Open the app in your browser (usually at http://localhost:5173)
2. Click on the "Sign in with Google" button
3. Complete the Google authentication flow
4. You should now be logged in with your zkLogin account

## Troubleshooting

- **Popup Blocked**: Make sure to allow popups from your application domain
- **Redirect Issues**: Verify that your redirect URIs are correctly configured in both Google Cloud Console and Enoki
- **Network Errors**: Ensure that the selected network in the app matches the network enabled for your Enoki API key

## Additional Resources

- [Enoki Documentation](https://docs.enoki.mystenlabs.com/)
- [Sui zkLogin Documentation](https://docs.sui.io/concepts/cryptography/zklogin)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
