import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  verifyUserTransaction, 
  verifyMultipleFunctions,
  computeFunctionSelector,
  MAX_VERIFICATION_DURATION_SECONDS,
  type VerificationFunction,
  type VerificationLogic,
} from '@/lib/services/blockExplorerVerification';

interface VerifyXpQuestRequest {
  questId: string;
  walletAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyXpQuestRequest = await request.json();
    const { questId, walletAddress } = body;

    if (!questId || !walletAddress) {
      return NextResponse.json(
        { error: 'questId and walletAddress are required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const supabase = await createClient();

    // Get the XP quest
    const { data: quest, error: questError } = await supabase
      .from('mint_platform_xp_quest_campaigns')
      .select('*')
      .eq('id', questId)
      .eq('is_active', true)
      .single();

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    const { data: existingCompletion } = await supabase
      .from('mint_platform_xp_quest_completions')
      .select('id')
      .eq('quest_id', questId)
      .eq('wallet_address', normalizedAddress)
      .single();

    if (existingCompletion) {
      return NextResponse.json({
        verified: true,
        message: 'Quest already completed',
        alreadyCompleted: true,
      });
    }

    // Enforce max duration for safety (prevents RPC timeouts)
    const durationSeconds = Math.min(quest.duration_seconds, MAX_VERIFICATION_DURATION_SECONDS);

    // Determine verification method based on quest configuration
    let verificationResult;
    
    // Check if quest uses new multi-function format
    const hasMultipleFunctions = quest.verification_functions && 
      Array.isArray(quest.verification_functions) && 
      quest.verification_functions.length > 0;

    if (hasMultipleFunctions) {
      // Use multi-function verification
      const functions = quest.verification_functions as VerificationFunction[];
      const logic = (quest.verification_logic || 'OR') as VerificationLogic;
      
      verificationResult = await verifyMultipleFunctions({
        walletAddress: normalizedAddress,
        contractAddress: quest.verification_contract,
        functions,
        logic,
        chainId: quest.verification_chain_id,
        durationSeconds,
      });
    } else {
      // Fallback to legacy single function verification
      const functionSelector = computeFunctionSelector(quest.function_signature);
      
      verificationResult = await verifyUserTransaction({
        walletAddress: normalizedAddress,
        contractAddress: quest.verification_contract,
        functionSelector,
        chainId: quest.verification_chain_id,
        durationSeconds,
      });
    }

    if (!verificationResult.verified) {
      return NextResponse.json({
        verified: false,
        error: verificationResult.error || 'No matching transaction found. Complete the task and try again.',
      });
    }

    // Record the completion
    // Store all tx hashes if multiple (AND logic), otherwise single tx hash
    const txHashToStore = verificationResult.txHashes 
      ? verificationResult.txHashes.join(',') 
      : verificationResult.txHash || null;
      
    const { error: completionError } = await supabase
      .from('mint_platform_xp_quest_completions')
      .insert({
        quest_id: questId,
        wallet_address: normalizedAddress,
        tx_hash: txHashToStore,
        xp_awarded: quest.xp_reward,
      });

    if (completionError) {
      console.error('Error recording completion:', completionError);
      return NextResponse.json(
        { error: 'Failed to record completion' },
        { status: 500 }
      );
    }

    // Update user's total XP
    const { data: existingXp } = await supabase
      .from('mint_platform_user_xp')
      .select('total_xp')
      .eq('wallet_address', normalizedAddress)
      .single();

    if (existingXp) {
      await supabase
        .from('mint_platform_user_xp')
        .update({
          total_xp: existingXp.total_xp + quest.xp_reward,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', normalizedAddress);
    } else {
      await supabase.from('mint_platform_user_xp').insert({
        wallet_address: normalizedAddress,
        total_xp: quest.xp_reward,
      });
    }

    return NextResponse.json({
      verified: true,
      message: 'Quest completed successfully!',
      txHash: verificationResult.txHash,
      xpAwarded: quest.xp_reward,
    });
  } catch (error) {
    console.error('XP Quest verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
