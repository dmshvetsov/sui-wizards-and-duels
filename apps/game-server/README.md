# Magic Duel Game Server

This is the backend of the game, implemented using Supabase Edge Functions.

## Setup

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase (if not already done):
   ```bash
   supabase init
   ```

3. Start the local Supabase instance:
   ```bash
   npm start
   ```

4. Set up environment variables:
   Create a `.env` file with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Development

To serve the functions locally:
```bash
npm run serve
```

## Deployment

To deploy the functions to your Supabase project:
```bash
npm run deploy
```

## How It Works

1. The `waitroom-pairing` function runs every 30 seconds via a cron job
2. It fetches all users currently in the "waitroom" channel
3. It pairs users based on their join time (earliest first)
4. It sends a message to each pair with a link to their duel
5. The link format is `/d/new/:player1Id/vs/:player2Id` where player1 is the player who joined first