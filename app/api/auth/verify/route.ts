import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { createClient } from '@/lib/supabase/server';

// Parse SIWE message to extract fields
function parseSiweMessage(message: string) {
  const lines = message.split('\n');
  const result: Record<string, string> = {};
  
  // First line contains domain
  const domainMatch = lines[0]?.match(/^(.+) wants you to sign in/);
  if (domainMatch) result.domain = domainMatch[1];
  
  // Parse key-value pairs
  for (const line of lines) {
    if (line.startsWith('URI: ')) result.uri = line.slice(5);
    if (line.startsWith('Nonce: ')) result.nonce = line.slice(7);
    if (line.startsWith('Expiration Time: ')) result.expirationTime = line.slice(17);
    if (line.startsWith('Chain ID: ')) result.chainId = line.slice(10);
    
    // Extract address from "with your Ethereum account:" line
    if (line.match(/^0x[a-fA-F0-9]{40}$/)) result.address = line;
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { message, signature, address } = await request.json();

    if (!message || !signature || !address) {
      return NextResponse.json(
        { error: 'Message, signature, and address are required' },
        { status: 400 }
      );
    }

    // Verify the signature using viem
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the SIWE message to extract nonce and expiration
    const parsedMessage = parseSiweMessage(message);
    const walletAddress = address.toLowerCase();

    // Store session in Supabase
    const supabase = await createClient();
    
    // Upsert wallet session (create or update)
    const { error: sessionError } = await supabase
      .from('wallet_sessions')
      .upsert(
        {
          wallet_address: walletAddress,
          nonce: parsedMessage.nonce || '',
          expires_at: parsedMessage.expirationTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address' }
      );

    if (sessionError) {
      console.error('Session storage error:', sessionError);
      // Continue even if session storage fails - wallet is still verified
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      address: walletAddress,
    });

    // Set a secure HTTP-only cookie for session tracking
    response.cookies.set('wallet_session', walletAddress, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('SIWE verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear the session cookie
    response.cookies.set('wallet_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('wallet_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify session exists in Supabase
    const supabase = await createClient();
    const { data: session } = await supabase
      .from('wallet_sessions')
      .select('wallet_address, expires_at')
      .eq('wallet_address', sessionCookie.value)
      .single();

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    // Check if session is expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      address: session.wallet_address,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
