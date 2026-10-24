import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

/**
 * Custom throttler guard that implements per-user rate limiting
 * in addition to IP-based rate limiting.
 * 
 * Prevents brute force attacks where attackers rotate IPs to bypass
 * IP-only rate limiting. Tracks by email for login/forgot-password
 * endpoints and by token for reset-password endpoint.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Generate a unique tracking key based on request context
   * @param req Express request object
   * @returns Tracking key string (email, token, or IP)
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Get real client IP (considering trusted proxy configuration)
    // req.ips contains array of IPs from X-Forwarded-For when trust proxy is enabled
    const ip = req.ips?.length ? req.ips[0] : req.ip;
    
    const body = req.body;
    
    // For login and forgot-password endpoints, track by email
    // This prevents brute force on a specific account from different IPs
    if (body?.email) {
      return `email:${body.email.toLowerCase()}`;
    }
    
    // For reset-password endpoint, track by token
    // This prevents multiple reset attempts with the same token from different IPs
    if (body?.token) {
      return `token:${body.token}`;
    }
    
    // For OTP endpoints, track by email if present
    if (body?.otp) {
      return `email:${body.email?.toLowerCase() || 'unknown'}`;
    }
    
    // Default fallback: track by IP only
    // This applies to any endpoints without specific tracking needs
    return `ip:${ip}`;
  }
  
  /**
   * Custom exception message for rate limit exceeded
   */
  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Too many requests. Please try again later.');
  }
}
