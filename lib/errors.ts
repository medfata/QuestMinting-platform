'use client';

/**
 * Error codes for minting operations
 */
export type MintErrorCode = 
  | 'INSUFFICIENT_FUNDS' 
  | 'USER_REJECTED' 
  | 'CONTRACT_ERROR' 
  | 'NETWORK_ERROR';

/**
 * Error class for minting-related failures
 */
export class MintError extends Error {
  constructor(
    message: string,
    public code: MintErrorCode
  ) {
    super(message);
    this.name = 'MintError';
  }

  static fromError(error: unknown): MintError {
    if (error instanceof MintError) return error;
    
    const message = error instanceof Error ? error.message : String(error);
    
    // Detect common wallet/transaction errors
    if (message.includes('insufficient funds') || message.includes('InsufficientFunds')) {
      return new MintError('Not enough balance to complete this mint', 'INSUFFICIENT_FUNDS');
    }
    if (message.includes('user rejected') || message.includes('User rejected') || message.includes('denied')) {
      return new MintError('Transaction was cancelled', 'USER_REJECTED');
    }
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return new MintError('Network connection issue. Please try again', 'NETWORK_ERROR');
    }
    
    return new MintError('Minting failed. Please try again', 'CONTRACT_ERROR');
  }
}

/**
 * Eligibility requirement details
 */
export interface EligibilityRequirement {
  type: 'nft' | 'token';
  minAmount: string;
  current: string;
}

/**
 * Error class for eligibility check failures
 */
export class EligibilityError extends Error {
  constructor(
    message: string,
    public requirement: EligibilityRequirement
  ) {
    super(message);
    this.name = 'EligibilityError';
  }

  static create(type: 'nft' | 'token', minAmount: string, current: string): EligibilityError {
    const itemType = type === 'nft' ? 'NFTs' : 'tokens';
    return new EligibilityError(
      `You need at least ${minAmount} ${itemType} to participate. Current balance: ${current}`,
      { type, minAmount, current }
    );
  }
}


/**
 * Error codes for authentication operations
 */
export type AuthErrorCode = 
  | 'SIGNATURE_INVALID' 
  | 'SESSION_EXPIRED' 
  | 'UNAUTHORIZED';

/**
 * Error class for authentication failures
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode
  ) {
    super(message);
    this.name = 'AuthError';
  }

  static fromError(error: unknown): AuthError {
    if (error instanceof AuthError) return error;
    
    const message = error instanceof Error ? error.message : String(error);
    
    if (message.includes('signature') || message.includes('Signature')) {
      return new AuthError('Invalid signature. Please try again', 'SIGNATURE_INVALID');
    }
    if (message.includes('expired') || message.includes('Expired')) {
      return new AuthError('Session expired. Please reconnect your wallet', 'SESSION_EXPIRED');
    }
    
    return new AuthError('Unauthorized access', 'UNAUTHORIZED');
  }
}

/**
 * User-friendly error messages by error type
 */
export const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_FUNDS: 'Not enough balance to complete this mint',
  USER_REJECTED: 'Transaction was cancelled',
  CONTRACT_ERROR: 'Minting failed. Please try again',
  NETWORK_ERROR: 'Network connection issue. Please try again',
  SIGNATURE_INVALID: 'Invalid signature. Please try again',
  SESSION_EXPIRED: 'Session expired. Please reconnect your wallet',
  UNAUTHORIZED: 'Unauthorized access',
};

/**
 * Get a user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof MintError || error instanceof AuthError) {
    return error.message;
  }
  if (error instanceof EligibilityError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
