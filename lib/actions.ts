'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Fetch daily metrics for the current user
 */
export async function getDailyMetrics() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching metrics:', error);
        return null;
    }

    return data || {
        focus_time_minutes: 0,
        distraction_time_minutes: 0,
        focus_score: 0,
        sessions_today: 0,
        longest_streak_minutes: 0
    };
}

/**
 * Fetch activity feed for the current user
 */
export async function getActivityFeed() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching activity:', error);
        return [];
    }

    return data;
}

/**
 * Fetch website activity for the current user
 */
export async function getWebsiteActivity() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('website_activity')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .order('time_spent_seconds', { ascending: false });

    if (error) {
        console.error('Error fetching website activity:', error);
        return [];
    }

    return data;
}

/**
 * Fetch user settings
 */
export async function getUserSettings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return null;
    }

    return data;
}

/**
 * Update user settings
 */
export async function updateUserSettings(settings: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            id: user.id,
            ...settings,
            updated_at: new Date().toISOString()
        });

    if (error) throw error;

    revalidatePath('/protected');
}

/**
 * Fetch distraction timeline for the current user
 */
export async function getDistractionTimeline() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'distraction')
        .order('start_time', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching distraction timeline:', error);
        return [];
    }

    return data;
}

/**
 * Fetch weekly metrics for the trend chart
 */
export async function getWeeklyMetrics() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const { data, error } = await supabase
        .from('daily_metrics')
        .select('date, focus_time_minutes, focus_score')
        .eq('user_id', user.id)
        .gte('date', lastWeek.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching weekly metrics:', error);
        return [];
    }

    return data;
}

/**
 * Fetch top distracting sites for the current user
 */
export async function getTopDistractions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('website_activity')
        .select('domain, time_spent_seconds')
        .eq('user_id', user.id)
        .eq('category', 'Distracting')
        .order('time_spent_seconds', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching top distractions:', error);
        return [];
    }

    return data.map(item => ({
        name: item.domain,
        time: Math.round(item.time_spent_seconds / 60)
    }));
}

/**
 * Fetch all focus sessions for today for the activity timeline
 */
export async function getTodaySessions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('start_time', new Date().toISOString().split('T')[0])
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching today sessions:', error);
        return [];
    }

    return data;
}

/**
 * Fetch alerts for the current user
 */
export async function getAlerts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }

    return data;
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId)
        .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/protected');
}
