# Requirements Document

## Introduction

A multi-chain NFT minting platform that offers two core experiences: **MintFun** (simple free/paid minting) and **Quests** (task-based free minting with eligibility conditions). The platform provides full admin customization including blockchain selection, UI theming, and content management. Users authenticate via wallet connection using WalletConnect and wagmi, with Supabase as the backend database.

## Glossary

- **MintFun**: A minting experience where users can mint NFTs with tiered pricing options (free, paid tiers)
- **Quest**: A task-based minting experience requiring users to complete external tasks before minting
- **Admin**: Platform administrator who configures chains, themes, mint options, and quests
- **User**: End user who connects wallet, completes tasks, and mints NFTs
- **Eligibility Condition**: Optional requirements (NFT holdings, token holdings) users must meet to participate
- **Chain**: A supported blockchain network where minting occurs
- **Theme**: Customizable color scheme and fonts for pages
- **Carousel**: A rotating display of featured quests and MintFun campaigns on the home page

## Requirements

### Requirement 1: Wallet Authentication

**User Story:** As a User, I want to connect my wallet to the platform, so that I can authenticate and interact with minting features.

#### Acceptance Criteria

1. WHEN the User clicks the connect wallet button, THE Platform SHALL display WalletConnect modal with supported wallet options.
2. WHEN the User selects a wallet and approves the connection, THE Platform SHALL request a signature for session authentication.
3. WHEN the User signs the authentication message, THE Platform SHALL create an authenticated session and store it in Supabase.
4. WHILE the User has an active session, THE Platform SHALL display the connected wallet address in the navigation.
5. WHEN the User clicks disconnect, THE Platform SHALL terminate the session and clear authentication state.

### Requirement 2: MintFun Campaign Display

**User Story:** As a User, I want to view MintFun campaigns, so that I can see available minting options and their pricing.

#### Acceptance Criteria

1. WHEN the User navigates to a MintFun campaign page, THE Platform SHALL display the campaign image, title, and description.
2. WHEN the User views a MintFun campaign, THE Platform SHALL display all mint tier options with their quantities and prices.
3. WHILE the campaign page loads, THE Platform SHALL apply the admin-configured color theme for that campaign.
4. WHEN the User is not connected, THE Platform SHALL display a prompt to connect wallet before minting.

### Requirement 3: MintFun Minting

**User Story:** As a User, I want to mint NFTs from a MintFun campaign, so that I can acquire NFTs at my chosen tier.

#### Acceptance Criteria

1. WHEN the User selects a free mint tier and clicks mint, THE Platform SHALL initiate a mint transaction on the configured chain.
2. WHEN the User selects a paid mint tier and clicks mint, THE Platform SHALL initiate a mint transaction with the required payment amount.
3. WHILE a mint transaction is pending, THE Platform SHALL display a loading state with transaction status.
4. WHEN the mint transaction succeeds, THE Platform SHALL display a success message with transaction details.
5. IF the mint transaction fails, THEN THE Platform SHALL display an error message with the failure reason.

### Requirement 4: Quest Campaign Display

**User Story:** As a User, I want to view Quest campaigns, so that I can see required tasks and eligibility conditions.

#### Acceptance Criteria

1. WHEN the User navigates to a Quest campaign page, THE Platform SHALL display the campaign image, title, description, and task list.
2. WHEN the User views a Quest campaign with eligibility conditions, THE Platform SHALL display NFT holding requirements if configured.
3. WHEN the User views a Quest campaign with eligibility conditions, THE Platform SHALL display token holding requirements if configured.
4. WHILE the campaign page loads, THE Platform SHALL apply the admin-configured color theme for that campaign.
5. WHEN the User is connected, THE Platform SHALL check and display the User's eligibility status for each condition.

### Requirement 5: Quest Task Completion

**User Story:** As a User, I want to complete quest tasks, so that I can become eligible to mint for free.

#### Acceptance Criteria

1. WHEN the User clicks on a task with an external URL, THE Platform SHALL open the external URL in a new browser tab.
2. WHEN the User clicks the verify button for a task, THE Platform SHALL check task completion status via configured verification method.
3. WHEN all tasks are verified as complete, THE Platform SHALL enable the mint button for the User.
4. WHILE tasks remain incomplete, THE Platform SHALL display the mint button in a disabled state.
5. WHEN the User completes all tasks and clicks mint, THE Platform SHALL initiate a free mint transaction on the configured chain.

### Requirement 6: Quest Eligibility Verification

**User Story:** As a User, I want to know if I meet eligibility requirements, so that I can participate in restricted quests.

#### Acceptance Criteria

1. WHEN the User connects wallet to a Quest with NFT holding condition, THE Platform SHALL query the configured chain for NFT balance.
2. WHERE the Admin configured a specific NFT collection address, THE Platform SHALL check holdings only for that collection.
3. WHERE the Admin configured only a minimum NFT count without collection address, THE Platform SHALL check total NFT holdings on the chain.
4. WHEN the User connects wallet to a Quest with token holding condition, THE Platform SHALL query the configured chain for token balance.
5. WHERE the Admin configured a specific token address, THE Platform SHALL check holdings only for that token.
6. IF the User does not meet eligibility requirements, THEN THE Platform SHALL display a message explaining the unmet conditions.

### Requirement 7: Admin MintFun Management

**User Story:** As an Admin, I want to create and configure MintFun campaigns, so that I can offer minting experiences to users.

#### Acceptance Criteria

1. WHEN the Admin creates a new MintFun campaign, THE Platform SHALL require chain selection, campaign image, title, and description.
2. WHEN the Admin configures mint tiers, THE Platform SHALL allow setting quantity and price for each tier (including free tier at 0 price).
3. WHEN the Admin sets page colors, THE Platform SHALL save primary, secondary, and background color values for the campaign.
4. WHEN the Admin saves the campaign, THE Platform SHALL store all configuration in Supabase and make the campaign accessible via unique URL.
5. WHEN the Admin edits an existing campaign, THE Platform SHALL load current configuration and allow modifications.

### Requirement 8: Admin Quest Management

**User Story:** As an Admin, I want to create and configure Quest campaigns, so that I can offer task-based minting experiences.

#### Acceptance Criteria

1. WHEN the Admin creates a new Quest campaign, THE Platform SHALL require chain selection, campaign image, title, and description.
2. WHEN the Admin adds tasks to a Quest, THE Platform SHALL allow setting task type, description, and external URL for each task.
3. WHERE the Admin enables NFT eligibility condition, THE Platform SHALL allow setting minimum NFT count and optional collection address.
4. WHERE the Admin enables token eligibility condition, THE Platform SHALL allow setting minimum token amount and optional token address.
5. WHEN the Admin sets page colors, THE Platform SHALL save primary, secondary, and background color values for the Quest.
6. WHEN the Admin saves the Quest, THE Platform SHALL store all configuration in Supabase and make the Quest accessible via unique URL.

### Requirement 9: Admin Home Page Customization

**User Story:** As an Admin, I want to customize the home page, so that I can control the platform's appearance and featured content.

#### Acceptance Criteria

1. WHEN the Admin configures global theme, THE Platform SHALL allow setting primary, secondary, and background colors.
2. WHEN the Admin configures typography, THE Platform SHALL allow selecting font family for headings and body text.
3. WHEN the Admin edits home page content, THE Platform SHALL allow setting hero title, subtitle, and description text.
4. WHEN the Admin configures the carousel, THE Platform SHALL allow selecting which Quests and MintFun campaigns to feature.
5. WHEN the Admin saves home page settings, THE Platform SHALL apply changes immediately to the public home page.

### Requirement 10: Admin Chain Management

**User Story:** As an Admin, I want to manage supported blockchains, so that I can control which networks are available for campaigns.

#### Acceptance Criteria

1. WHEN the Admin views chain settings, THE Platform SHALL display all available blockchain options.
2. WHEN the Admin enables a chain, THE Platform SHALL make that chain available for campaign creation.
3. WHEN the Admin disables a chain, THE Platform SHALL prevent new campaigns from using that chain while preserving existing campaigns.
4. WHEN the Admin configures a chain, THE Platform SHALL allow setting RPC endpoint and contract addresses.

### Requirement 11: Home Page Display

**User Story:** As a User, I want to view the home page, so that I can discover available Quests and MintFun campaigns.

#### Acceptance Criteria

1. WHEN the User visits the home page, THE Platform SHALL display the admin-configured hero content.
2. WHEN the User views the home page, THE Platform SHALL display a carousel of featured Quests and MintFun campaigns.
3. WHILE the home page loads, THE Platform SHALL apply the admin-configured global theme colors and fonts.
4. WHEN the User clicks a carousel item, THE Platform SHALL navigate to the corresponding Quest or MintFun campaign page.
