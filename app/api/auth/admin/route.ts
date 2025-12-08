import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('wallet_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' });
    }

    const walletAddress = sessionCookie.value.toLowerCase();

    // Use admin client to bypass RLS and check admin status
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('mint_platform_admin_users')
      .select('id, role')
      .ilike('wallet_address', walletAddress)
      .single();

    if (error || !data) {
      return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({
      isAdmin: true,
      role: data.role,
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Failed to verify admin status' },
      { status: 500 }
    );
  }
}
