'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner'; // optional spinner component

export default function AuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        async function handleAuthCallback() {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');

            if (!accessToken) {
                // If no token, redirect to login
                router.replace('/auth/login');
                return;
            }

            try {
                // Example: save token in Supabase auth session
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || '',
                });

                if (error) {
                    console.error('Supabase auth error:', error.message);
                    router.replace('/auth/login');
                    return;
                }

                // Redirect to dashboard after successful login
                router.replace('/dashboard');
            } catch (err) {
                console.error('Auth callback error:', err);
                router.replace('/auth/login');
            }
        }

        handleAuthCallback();
    }, [searchParams, router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center px-4">
            <Spinner className="w-12 h-12 mb-4 text-blue-600 animate-spin" />
            <h1 className="text-xl font-bold text-blue-900">Connexion en cours...</h1>
            <p className="text-blue-500 mt-2">Veuillez patienter pendant que nous terminons l’authentification.</p>
        </div>
    );
}
