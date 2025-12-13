import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient, http, parseAbi, type Chain } from 'viem';
import * as viemChains from 'viem/chains';

interface VerifyXpQuestRequest {
  taskId: string;
  questId: string;
  walletAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyXpQuestRequest = await request.json();
    const { taskId, questId, walletAddress } = body;

    if (!taskId || !questId || !walletAddress) {
      return NextResponse.json(
        { error: 'taskId, questId, and walletAddress are required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const supabase = await createClient();

    // Get the task with verification data
    const { data: task, error: taskError } = await supabase
      .from('mint_platform_quest_tasks')
      .select('id, quest_id, type, verification_data')
      .eq('id', taskId)
      .eq('quest_id', questId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.type !== 'xp_quest') {
      return NextResponse.json(
        { error: 'This endpoint is only for XP quest verification' },
        { status: 400 }
      );
    }

    // Check if already completed
    const { data: existingCompletion } = await supabase
      .from('mint_platform_user_task_completions')
      .select('id')
      .eq('task_id', taskId)
      .eq('wallet_address', normalizedAddress)
      .single();

    if (existingCompletion) {
      return NextResponse.json({
        verified: true,
        message: 'Task already completed',
        alreadyCompleted: true,
      });
    }

    // Extract verification data
    const verificationData = task.verification_data as {
      xp_reward?: string;
      duration_minutes?: string;
      verification_contract?: string;
      verification_function?: string;
      verification_chain_id?: string;
    };

    const {
      xp_reward,
      duration_minutes,
      verification_contract,
      verification_function,
      verification_chain_id,
    } = verificationData;

    if (!verification_contract || !verification_function || !verification_chain_id) {
      return NextResponse.json(
        { error: 'Task verification configuration is incomplete' },
        { status: 400 }
      );
    }

    const chainId = parseInt(verification_chain_id, 10);
    const durationSeconds = parseInt(duration_minutes || '60', 10) * 60;
    const xpAmount = parseInt(xp_reward || '0', 10);

    // Get chain configuration from viem
    const chain = Object.values(viemChains).find(
      (c): c is Chain => typeof c === 'object' && c !== null && 'id' in c && c.id === chainId
    );
    
    if (!chain) {
      return NextResponse.json(
        { error: `Chain ${chainId} not supported` },
        { status: 400 }
      );
    }

    // Create public client for the verification chain
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Build the ABI for the verification function
    // Assumes function takes address and returns uint256 (timestamp)
    const abi = parseAbi([
      `function ${verification_function}(address) view returns (uint256)`,
    ]);

    let lastTimestamp: bigint;
    try {
      // Call the verification function on the third-party contract
      lastTimestamp = await publicClient.readContract({
        address: verification_contract as `0x${string}`,
        abi,
        functionName: verification_function,
        args: [walletAddress as `0x${string}`],
      }) as bigint;
    } catch (contractError) {
      console.error('Contract call failed:', contractError);
      return NextResponse.json({
        verified: false,
        message: 'Failed to verify on-chain. Make sure you completed the task on the external platform.',
        error: 'contract_call_failed',
      });
    }

    // Check if the timestamp is within the duration window
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const timeDiff = currentTimestamp - lastTimestamp;

    if (lastTimestamp === BigInt(0)) {
      return NextResponse.json({
        verified: false,
        message: 'No activity found. Please complete the task on the external platform first.',
        error: 'no_activity',
      });
    }

    if (timeDiff > BigInt(durationSeconds)) {
      return NextResponse.json({
        verified: false,
        message: `Task must be completed within ${duration_minutes} minutes. Your last activity was too long ago.`,
        error: 'duration_exceeded',
        lastActivity: Number(lastTimestamp),
        currentTime: Number(currentTimestamp),
        durationSeconds,
      });
    }

    // Verification passed! Record the completion
    const { error: insertError } = await supabase
      .from('mint_platform_user_task_completions')
      .insert({
        task_id: taskId,
        wallet_address: normalizedAddress,
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error recording task completion:', insertError);
      return NextResponse.json(
        { error: 'Failed to record task completion' },
        { status: 500 }
      );
    }

    // Award XP to the user
    if (xpAmount > 0) {
      // Upsert user XP record
      const { data: existingXp } = await supabase
        .from('mint_platform_user_xp')
        .select('total_xp')
        .eq('wallet_address', normalizedAddress)
        .single();

      if (existingXp) {
        await supabase
          .from('mint_platform_user_xp')
          .update({
            total_xp: existingXp.total_xp + xpAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('wallet_address', normalizedAddress);
      } else {
        await supabase.from('mint_platform_user_xp').insert({
          wallet_address: normalizedAddress,
          total_xp: xpAmount,
        });
      }

      // Record XP transaction
      await supabase.from('mint_platform_xp_transactions').insert({
        wallet_address: normalizedAddress,
        task_id: taskId,
        xp_amount: xpAmount,
        verification_timestamp: Number(lastTimestamp),
      });
    }

    return NextResponse.json({
      verified: true,
      message: 'Task verified successfully!',
      xpAwarded: xpAmount,
      verificationTimestamp: Number(lastTimestamp),
    });
  } catch (error) {
    console.error('XP Quest verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
