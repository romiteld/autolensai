import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/common/types/database.types';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const redirectTo = requestUrl.searchParams.get('redirect') || '/dashboard';

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL('/auth/login', requestUrl.origin);
    loginUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient<Database>({ 
        cookies: () => cookieStore 
      });

      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        const loginUrl = new URL('/auth/login', requestUrl.origin);
        loginUrl.searchParams.set('error', 'Authentication failed. Please try again.');
        return NextResponse.redirect(loginUrl);
      }

      if (data.user) {
        // Check if this is a new user and create profile if needed
        if (data.user.created_at === data.user.last_sign_in_at) {
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                first_name: data.user.user_metadata?.first_name || data.user.user_metadata?.full_name?.split(' ')[0] || '',
                last_name: data.user.user_metadata?.last_name || data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                avatar_url: data.user.user_metadata?.avatar_url || null,
                provider: data.user.app_metadata?.provider || 'email',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              // Don't fail the login for profile creation errors
            }
          } catch (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail the login for profile creation errors
          }
        }

        // Successful authentication - redirect to the intended destination
        const redirectUrl = new URL(redirectTo, requestUrl.origin);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Callback error:', error);
      const loginUrl = new URL('/auth/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'Authentication failed. Please try again.');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Fallback - redirect to login if no code or other issues
  const loginUrl = new URL('/auth/login', requestUrl.origin);
  loginUrl.searchParams.set('error', 'Authentication failed. Please try again.');
  return NextResponse.redirect(loginUrl);
}