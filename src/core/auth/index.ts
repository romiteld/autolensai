// Core authentication exports
export * from './providers/supabase.provider';
export * from './guards/auth.guard';
export * from './decorators/auth.decorator';
export * from './strategies/jwt.strategy';

// Re-export common types
export type { AuthUser, AuthSession } from './providers/supabase.provider';
export type { AuthContext, AuthGuardOptions } from './guards/auth.guard';
export type { JWTPayload } from './strategies/jwt.strategy';

// Common authentication utilities
import { authProvider } from './providers/supabase.provider';
import { AuthGuard } from './guards/auth.guard';
import { jwtStrategy } from './strategies/jwt.strategy';

// Export auth provider directly
export { authProvider };

export const auth = {
  provider: authProvider,
  guard: AuthGuard,
  jwt: jwtStrategy,
} as const;