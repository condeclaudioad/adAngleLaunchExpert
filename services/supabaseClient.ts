// services/supabaseClient.ts - NUEVO ARCHIVO

import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, VIP_EMAILS } from '../constants';
import { User, VipUser } from '../types';

// ═══════════════════════════════════════════════════════════
// CLIENTE SUPABASE
// ═══════════════════════════════════════════════════════════

let supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (!supabase) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Supabase credentials not configured');
        }
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
};

// ═══════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════





export const signInWithEmail = async (email: string, password: string): Promise<SupabaseUser | null> => {
    const { data, error } = await getSupabase().auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data.user;
};

export const signUpWithEmail = async (email: string, password: string, name: string): Promise<SupabaseUser | null> => {
    // 1. Check VIP status BEFORE creating auth user
    const isVip = await checkIsVip(email);
    if (!isVip) {
        throw new Error("Este email no está en la lista de acceso VIP.");
    }

    // 2. Proceed with signup
    const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });
    if (error) throw error;
    return data.user;
};

export const signOut = async (): Promise<void> => {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
};

export const getCurrentUser = async (): Promise<SupabaseUser | null> => {
    const { data: { user } } = await getSupabase().auth.getUser();
    return user;
};

export const onAuthStateChange = (callback: (user: SupabaseUser | null) => void) => {
    return getSupabase().auth.onAuthStateChange((event, session) => {
        callback(session?.user ?? null);
    });
};

// ═══════════════════════════════════════════════════════════
// VIP MANAGEMENT
// ═══════════════════════════════════════════════════════════

export const checkIsVip = async (email: string): Promise<boolean> => {
    if (!email) return false;
    const lowerEmail = email.toLowerCase().trim();

    // 1. Check Local Hardcoded List (Fastest & Most Reliable for constants)
    if (VIP_EMAILS.includes(lowerEmail)) {
        console.log(`VIP Access Granted (Local List): ${lowerEmail}`);
        return true;
    }

    // 2. Use RPC to check VIP status securely (works for anon users)
    try {
        const { data, error } = await getSupabase().rpc('check_is_vip', {
            check_email: lowerEmail
        });

        if (error) {
            console.warn('VIP RPC check error (ignoring if local passed):', error);
            // Don't return false yet if we want to be lenient, but strictly speaking if not in local and RPC fails, it's false.
            return false;
        }
        return !!data;
    } catch (e) {
        console.error("Critical VIP Check Error", e);
        return false;
    }
};

export const getAllVipUsers = async (): Promise<VipUser[]> => {
    const { data, error } = await getSupabase()
        .from('vip_users')
        .select('*')
        .eq('is_active', true)
        .order('added_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const addVipUser = async (email: string, addedBy: string): Promise<void> => {
    const { error } = await getSupabase()
        .from('vip_users')
        .upsert({
            email: email.toLowerCase().trim(),
            added_by: addedBy,
            is_active: true,
            added_at: new Date().toISOString()
        });

    if (error) throw error;
};

export const removeVipUser = async (email: string): Promise<void> => {
    const { error } = await getSupabase()
        .from('vip_users')
        .update({ is_active: false })
        .eq('email', email.toLowerCase());

    if (error) throw error;
};

// ═══════════════════════════════════════════════════════════
// ADMIN AUTHENTICATION
// ═══════════════════════════════════════════════════════════

export const checkAdminPassword = async (password: string): Promise<boolean> => {
    const { data, error } = await getSupabase().rpc('check_admin_password', {
        check_password: password
    });

    if (error) {
        console.error('Admin password check error:', error);
        return false;
    }
    return !!data;
};

// ═══════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════

export const getUserProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await getSupabase()
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
};

export const upsertUserProfile = async (user: Partial<User>): Promise<void> => {
    const { error } = await getSupabase()
        .from('user_profiles')
        .upsert(user);

    if (error) throw error;
};

// ═══════════════════════════════════════════════════════════
// API KEYS STORAGE (encrypted in user metadata)
// ═══════════════════════════════════════════════════════════

export const saveApiKeys = async (keys: { google?: string; grok?: string }): Promise<void> => {
    const { error } = await getSupabase().auth.updateUser({
        data: { api_keys: keys }
    });
    if (error) throw error;
};

export const getApiKeys = async (): Promise<{ google?: string; grok?: string }> => {
    const user = await getCurrentUser();
    return user?.user_metadata?.api_keys || {};
};
