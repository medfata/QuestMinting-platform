import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface VerifyTaskRequest {
  taskId: string;
  questId: string;
  walletAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyTaskRequest = await request.json();
    const { taskId, questId, walletAddress } = body;

    if (!taskId || !questId || !walletAddress) {
      return NextResponse.json(
        { error: 'taskId, questId, and walletAddress are required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const supabase = await createClient();

    // Verify the task exists and belongs to the quest
    const { data: task, error: taskError } = await supabase
      .from('mint_platform_quest_tasks')
      .select('id, quest_id, type, external_url, verification_data')
      .eq('id', taskId)
      .eq('quest_id', questId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
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
      });
    }

    // Perform verification based on task type
    // For now, we'll use a simplified verification that marks tasks as complete
    // In production, you'd integrate with Twitter API, Discord API, etc.
    const verified = await verifyTaskCompletion(task);

    if (!verified) {
      return NextResponse.json({
        verified: false,
        message: 'Task verification failed. Please complete the task and try again.',
      });
    }

    // Record the completion
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

    return NextResponse.json({
      verified: true,
      message: 'Task verified successfully',
    });
  } catch (error) {
    console.error('Task verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

// Task verification logic
// In production, implement actual API integrations for each platform
async function verifyTaskCompletion(task: {
  type: string;
  external_url: string;
  verification_data: Record<string, string>;
}): Promise<boolean> {
  switch (task.type) {
    case 'twitter_follow':
      // In production: Use Twitter API to verify follow status
      // For now, mark as verified (user clicked verify after visiting)
      return true;

    case 'twitter_retweet':
      // In production: Use Twitter API to verify retweet
      return true;

    case 'telegram_join':
      // In production: Use Telegram Bot API to verify membership
      return true;

    case 'discord_join':
      // In production: Use Discord API to verify server membership
      return true;

    case 'custom_url':
      // Custom URLs are verified by user attestation (they clicked verify)
      return true;

    default:
      return false;
  }
}

// GET endpoint to check task completion status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questId = searchParams.get('questId');
    const walletAddress = searchParams.get('walletAddress');

    if (!questId || !walletAddress) {
      return NextResponse.json(
        { error: 'questId and walletAddress are required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const supabase = await createClient();

    // Get all tasks for the quest
    const { data: tasks, error: tasksError } = await supabase
      .from('mint_platform_quest_tasks')
      .select('id')
      .eq('quest_id', questId);

    if (tasksError) {
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    const taskIds = (tasks || []).map((t) => t.id);

    if (taskIds.length === 0) {
      return NextResponse.json({ completions: [] });
    }

    // Get completions for this user
    const { data: completions, error: completionsError } = await supabase
      .from('mint_platform_user_task_completions')
      .select('task_id, completed_at')
      .eq('wallet_address', normalizedAddress)
      .in('task_id', taskIds);

    if (completionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch completions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      completions: completions || [],
    });
  } catch (error) {
    console.error('Error fetching task completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completions' },
      { status: 500 }
    );
  }
}
