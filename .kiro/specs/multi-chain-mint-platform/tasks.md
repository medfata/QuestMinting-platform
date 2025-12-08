# Implementation Plan

- [x] 1. Set up project dependencies and configuration




  - [x] 1.1 Install core dependencies (wagmi, viem, @web3modal/wagmi, @supabase/supabase-js, @tanstack/react-query)


    - Run npm install for all required packages
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Configure environment variables

    - Create `.env.local` with NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
    - Create `.env.example` template
    - _Requirements: 1.1_

  - [x] 1.3 Set up Supabase client utilities

    - Create `lib/supabase/client.ts` for browser client
    - Create `lib/supabase/server.ts` for server components
    - _Requirements: 1.3_

- [x] 2. Create TypeScript types and interfaces






  - [x] 2.1 Define database types

    - Create `types/database.ts` with Supabase table types
    - _Requirements: 2.1, 4.1, 7.1, 8.1_

  - [x] 2.2 Define campaign and quest types

    - Create `types/campaign.ts` with MintFunCampaign, MintTier interfaces
    - Create `types/quest.ts` with QuestCampaign, QuestTask, EligibilityCondition interfaces
    - _Requirements: 2.1, 4.1, 4.2, 4.3_

  - [x] 2.3 Define theme and chain types

    - Create `types/theme.ts` with CampaignTheme, GlobalTheme, HomePageConfig interfaces
    - Create `types/chain.ts` with ChainlistNetwork, SupportedChain interfaces
    - _Requirements: 2.3, 9.1, 10.1_

- [x] 3. Implement wallet authentication system





  - [x] 3.1 Create WalletProvider component


    - Create `components/wallet/WalletProvider.tsx` with wagmi and Web3Modal setup
    - Wrap app in provider via `app/layout.tsx`
    - _Requirements: 1.1_
  - [x] 3.2 Create ConnectButton component


    - Create `components/wallet/ConnectButton.tsx` with connect/disconnect functionality
    - Display connected wallet address
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 3.3 Implement SIWE authentication

    - Create `app/api/auth/verify/route.ts` for signature verification
    - Create `hooks/useWalletAuth.ts` for session management
    - _Requirements: 1.2, 1.3_
  - [ ]* 3.4 Write unit tests for wallet authentication
    - Test connect flow, signature verification, session management
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Build reusable UI components





  - [x] 4.1 Create base UI components


    - Create `components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `Modal.tsx`
    - _Requirements: 2.1, 4.1_

  - [x] 4.2 Create themed container component

    - Create `components/layout/ThemedContainer.tsx` that applies dynamic CSS variables
    - Create `lib/utils/theme.ts` for theme CSS generation
    - _Requirements: 2.3, 4.4, 9.1_

  - [x] 4.3 Create layout components

    - Create `components/layout/Header.tsx` with navigation and ConnectButton
    - Create `components/layout/Footer.tsx`
    - _Requirements: 1.4, 11.1_
- [x] 5. Implement chainlist integration and chain management









- [ ] 5. Implement chainlist integration and chain management

  - [x] 5.1 Create chainlist service


    - Create `lib/services/chainlist.ts` with fetchAllChains, searchChains, transformToSupportedChain functions
    - _Requirements: 10.1, 10.2_

  - [x] 5.2 Create wagmi chain configuration

    - Create `lib/wagmi/config.ts` with dynamic chain loading from Supabase
    - Create `lib/wagmi/chains.ts` for chain utilities
    - _Requirements: 10.1, 10.4_

- [x] 6. Build MintFun campaign pages





  - [x] 6.1 Create MintFun display components


    - Create `components/campaigns/MintFunCard.tsx` for campaign preview
    - Create `components/campaigns/MintTierSelector.tsx` for tier selection
    - _Requirements: 2.1, 2.2_

  - [x] 6.2 Create minting hook

    - Create `hooks/useMint.ts` with writeContract and transaction tracking
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.3 Implement MintFun campaign page

    - Create `app/(public)/mint/[slug]/page.tsx` with campaign display and minting
    - Fetch campaign data from Supabase, apply theme, handle minting
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 6.4 Write tests for minting functionality
    - Test tier selection, transaction flow, error handling
    - _Requirements: 3.1, 3.2, 3.5_

- [x] 7. Build Quest campaign pages





  - [x] 7.1 Create Quest display components


    - Create `components/campaigns/QuestCard.tsx` for quest preview
    - Create `components/campaigns/TaskList.tsx` for task display and completion
    - Create `components/campaigns/EligibilityBadge.tsx` for eligibility status
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 7.2 Create eligibility verification hook

    - Create `hooks/useEligibility.ts` with NFT and token balance checks
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 7.3 Create task verification system


    - Create `hooks/useTaskVerification.ts` for task completion tracking
    - Create `app/api/tasks/verify/route.ts` for server-side verification
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 7.4 Implement Quest campaign page


    - Create `app/(public)/quest/[slug]/page.tsx` with tasks, eligibility, and minting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 7.5 Write tests for quest functionality
    - Test task completion, eligibility checks, quest minting
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.6_

- [x] 8. Build admin authentication and layout






  - [x] 8.1 Create admin auth guard

    - Create `components/wallet/WalletGuard.tsx` for admin route protection
    - Check wallet against admin_users table
    - _Requirements: 7.1, 8.1_

  - [x] 8.2 Create admin layout

    - Create `app/admin/layout.tsx` with sidebar navigation and auth guard
    - Create `app/admin/page.tsx` dashboard with campaign overview
    - _Requirements: 7.1, 8.1_

- [-] 9. Build admin MintFun management




  - [x] 9.1 Create MintFun form components

    - Create `components/admin/CampaignForm.tsx` for shared campaign fields
    - Create `components/admin/MintTierEditor.tsx` for tier configuration
    - Create `components/admin/ThemeEditor.tsx` with color pickers
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 9.2 Implement MintFun CRUD pages


    - Create `app/admin/campaigns/mintfun/new/page.tsx` for creation
    - Create `app/admin/campaigns/mintfun/[id]/page.tsx` for editing
    - Create `app/admin/campaigns/page.tsx` for campaign list
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 9.3 Write tests for MintFun admin
    - Test form validation, CRUD operations
    - _Requirements: 7.1, 7.4, 7.5_

- [x] 10. Build admin Quest management


  - [x] 10.1 Create Quest form components


    - Create `components/admin/TaskEditor.tsx` for task configuration
    - Create `components/admin/EligibilityEditor.tsx` for condition configuration
    - _Requirements: 8.2, 8.3, 8.4_


  - [x] 10.2 Implement Quest CRUD pages

    - Create `app/admin/campaigns/quest/new/page.tsx` for creation
    - Create `app/admin/campaigns/quest/[id]/page.tsx` for editing
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [ ]* 10.3 Write tests for Quest admin
    - Test task editor, eligibility editor, CRUD operations
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 11. Build admin chain management






  - [x] 11.1 Create chain management UI

    - Create `app/admin/settings/chains/page.tsx` with chain search and enable/disable
    - Integrate chainlist.org API for chain discovery
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [ ]* 11.2 Write tests for chain management
    - Test chain search, enable/disable, RPC configuration
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 12. Build admin home page customization




  - [x] 12.1 Create home page editor components


    - Create `components/admin/CarouselEditor.tsx` for featured campaign selection
    - _Requirements: 9.4_

  - [x] 12.2 Implement home page settings

    - Create `app/admin/home/page.tsx` with hero content, theme, and carousel editors
    - Create `app/admin/settings/theme/page.tsx` for global theme settings
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]* 12.3 Write tests for home page customization
    - Test theme editor, carousel editor, content saving

    - _Requirements: 9.1, 9.4, 9.5_

- [x] 13. Build public home page





  - [x] 13.1 Create carousel component

    - Create `components/ui/Carousel.tsx` for featured campaigns display
    - _Requirements: 11.2, 11.4_

  - [x] 13.2 Implement home page

    - Update `app/(public)/page.tsx` with hero section and campaign carousel
    - Fetch home config and featured campaigns from Supabase
    - Apply global theme
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [ ]* 13.3 Write tests for home page
    - Test carousel navigation, theme application
    - _Requirements: 11.1, 11.2, 11.3_


- [x] 14. Set up Supabase database schema



  - [x] 14.1 Create database migration

    - Create SQL migration file with all tables (supported_chains, mintfun_campaigns, mint_tiers, quest_campaigns, quest_tasks, eligibility_conditions, user_task_completions, home_config, admin_users)
    - _Requirements: 7.4, 8.6, 9.5, 10.2_

  - [x] 14.2 Set up Row Level Security policies
    - Create RLS policies for public read access and admin write access

    - _Requirements: 7.4, 8.6_
  - [x] 14.3 Create database indexes

    - Add indexes for slug lookups, active campaigns, wallet addresses
    - _Requirements: 2.1, 4.1, 11.2_
-

- [x] 15. Create error handling and loading states




  - [x] 15.1 Implement error types and handlers


    - Create `lib/errors.ts` with MintError, EligibilityError, AuthError classes
    - Create error boundary components
    - _Requirements: 3.5, 6.6_

  - [x] 15.2 Add loading states

    - Create loading skeletons for campaign pages
    - Add transaction pending states
    - _Requirements: 3.3_
