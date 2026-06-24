import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { env } from '../env';

/**
 * Validates the X-QIS-Api-Key header.
 * Uses a constant-time comparison against the hashed key in the environment to prevent timing attacks.
 */
export function verifyQisRequest(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-qis-api-key');

  if (!apiKey || !env.QIS_API_KEY_HASH) {
    return false;
  }

  try {
    // We assume env.QIS_API_KEY_HASH is a SHA-256 hex string of the actual API key.
    // In development, if QIS_API_KEY_HASH is not set but HUB_API_KEY is, we might fallback or just require hash.
    const providedHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Constant time comparison
    return crypto.timingSafeEqual(
      Buffer.from(providedHash),
      Buffer.from(env.QIS_API_KEY_HASH)
    );
  } catch (error) {
    console.error('[QIS Auth] Validation failed:', error);
    return false;
  }
}
