# Magic Duel Game on Sui Blockchain

## GAME ROAD MAP

- [x] landing page (and project pitching deck)
- [x] MVP with two-three spells
  - [x] 3-5 spells
  - [x] spell sound FX
  - [x] menu music
  - [x] duel music
  - [ ] spell visual FX, casting, applying damage and effects (must be done after RPC call optimizations)
- [x] auto-signing of duel transaction
- [x] demo duels against NPCs for fun and engaging learning process and user acquisition
- [x] new players welcome reward claim
- [x] duels with prizes, players can stake Sui before duel as a prize for the winner
- [ ] WnD reward token
  - [ ] add use case for the token to the landing
  - [ ] reward players for playing duels
  - [ ] reward new players as welcome gift, after demo duels with NPC
- [ ] optimizations
  - RPC calls optimizations, set gas coin, resolve object references to reduce number of RPC calls to make a spell
    - [x] hard-code gas budget per each transaction
    - [ ] pass object references
    - [ ] set gas price
    - [ ] set gas coin
  - [ ] group players by location, do not pair players with that have big difference in latency, use multiple location RPCs, warn players if latency is too high
  - [ ] use gRPC for transaction performance
- [ ] sponsored transactions, players pay in advance Gas to fund their force
- [ ] spell book with spells and their effects for read outside a duel
- [ ] list available spells during duel
- [ ] spell typing visual effects
- [ ] Wizard NFTs
  - [ ] reward new players with Wizard NFTs after completing demo duels
  - [ ] grant wizards experience in spell schools they use during duels
  - [ ] display wizard and his level in schools of spells
- [ ] improved game mechanics
  - [ ] more spells and sophisticated strategies to win
  - [ ] spells combo
  - [ ] multiple schools of wizards, each school has it is own spells and artifacts, wizards need to practice spells in duels to be able to level up in a school of that spells, with higher level wizards are able to cast more powerful spells
  - [ ] wizards level up in schools by using this school spells, higher level opens new spells and artifacts
  - [ ] wizards level affect spells damage and effect power
  - [ ] add dice for randomness of damage and effects
  - [ ] wizard can use only spell that they prepared for the duel
- [ ] split game into bot vs bot and player vs player modes, allow people to bot on chain package but bots must duel vs bots
- [ ] leader board
- [ ] rewrite in a game engine

## Sui resources

- https://notion.sui.io/overflow-2025-handbook hackathon handbook
- https://move-book.com/ Move book

## Sui Overflow hackathon resources

- overflow project submission guide https://suifoundation.notion.site/Sui-Overflow-2025-Detailed-Submission-Guide-1c137af41c6e80918e3cc383131ccbbb

## Inspiration

### Software Engineering

- last Overflow game track winner https://github.com/aresrpg
- Supabase wallet login example PR https://github.com/supabase/auth/pull/282/files
- Shinami sponsored transactions example https://github.com/shinamicorp/shinami-examples/tree/main/sui/typescript/dapp_kit_example
- Coin flip single and multi-player game https://github.com/MystenLabs/satoshi-coin-flip
- UNO game with react and socket.io https://github.com/guilhermebkel/uno-game
- MERN stack chat app https://github.com/rtewari056/bitchat
- react and socket.io chat app https://github.com/csmadhav/react-socket.io-chat-app
- deno and websockets chat app https://github.com/thecodeholic/deno-websocket-chat
- basic peer-to-peer websockets with Socket.io https://github.com/JamieWoodbury/simple-p2p-websockets
- Sui dev resources https://sui.io/developers
- awesome Sui https://github.com/sui-foundation/awesome-sui
- sign in with wallet standard example https://github.com/phantom/sign-in-with-solana and https://www.quicknode.com/guides/solana-development/dapps/how-to-authenticate-users-with-a-solana-wallet
- verify if an address is a multisig https://blog.sui.io/write-multi-signature-multisig-move-contracts/

### UI/UX

- https://github.com/swyxio/spark-joy?tab=readme-ov-file

## Sui gaming related platforms

- https://docs.sui.io/concepts/gaming
- https://www.snagsolutions.io/ Snag Solutoions provides white-label loyalty and marketplace platforms
- https://beamable.com/ Beamable is a development platform that helps you integrate live services and backend features into your games.
- https://www.suicoins.com/ Sui Coins is the utility layer for tokens and NFTs on the Sui network, offering asset management tools
- https://www.venly.io/ Venly is a developer platform that aids blockchain integration for businesses through secure digital wallets, tokenization services, and payment solutions
- https://build.forge.gg/ Forge is a platform that enables game developers to create custom loyalty programs 

## system design

- https://www.figma.com/board/vulT61m3l3rxAnANUi1MQL/Untitled?node-id=0-1&p=f&t=upMmLIDIUpy4016H-0 (private access)
