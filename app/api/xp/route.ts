import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET user XP and transaction history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const supabase = await createClient();

    // Get user's total XP
    const { data: userXp, error: xpError } = await supabase
      .from('mint_platform_user_xp')
      .select('total_xp, updated_at')
      .eq('wallet_address', normalizedAddress)
      .single();

    if (xpError && xpError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      console.error('Error fetching user XP:', xpError);
      return NextResponse.json(
        { error: 'Failed to fetch XP' },
        { status: 500 }
      );
    }

    // Get recent XP transactions
    const { data: transactions, error: txError } = await supabase
      .from('mint_platform_xp_transactions')
      .select(`
        id,
        xp_amount,
        tx_hash,
        verified_at,
        created_at,
        task_id
      `)
      .eq('wallet_address', normalizedAddress)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) {
      console.error('Error fetching XP transactions:', txError);
    }

    return NextResponse.json({
      totalXp: userXp?.total_xp || 0,
      lastUpdated: userXp?.updated_at || null,
      transactions: transactions || [],
    });
  } catch (error) {
    console.error('Error in XP API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
