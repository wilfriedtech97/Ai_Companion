'use server';

import {auth} from "@clerk/nextjs/server";
import {createSupabaseClient} from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export const createCompanion = async (formData: CreateCompanion) => {
    const { userId: author } = await auth();
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from('companions')
        .insert({...formData, author })
        .select();

    if(error || !data) throw new Error(error?.message || 'Failed to create a companion');

    return data[0];
}

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
    const supabase = createSupabaseClient();

    let query = supabase.from('companions').select();

    if(subject && topic) {
        query = query.ilike('subject', `%${subject}%`)
            .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    } else if(subject) {
        query = query.ilike('subject', `%${subject}%`)
    } else if(topic) {
        query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    }

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: companions, error } = await query;

    if(error) throw new Error(error.message);

    return companions;
}

export const getCompanion = async (id: string) => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('id', id);

    if(error) return console.log(error);

    return data[0];
}

export const addToSessionHistory = async (companionId: string) => {
    const { userId } = await auth();
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('session_history')
        .insert({
            companion_id: companionId,
            user_id: userId,
        })

    if(error) throw new Error(error.message);

    return data;
}

export const getRecentSessions = async (limit = 10) => {
    const supabase = createSupabaseClient();
    
    // First, get the recent session history entries
    const { data: sessions, error: sessionsError } = await supabase
        .from('session_history')
        .select('companion_id')
        .order('created_at', { ascending: false })
        .limit(limit);

    if(sessionsError) throw new Error(sessionsError.message);
    
    // If no sessions, return empty array
    if(!sessions || sessions.length === 0) {
        return [];
    }
    
    // Extract companion IDs
    const companionIds = sessions.map(session => session.companion_id);
    
    // Then fetch the actual companion data
    const { data: companions, error: companionsError } = await supabase
        .from('companions')
        .select('*')
        .in('id', companionIds);
        
    if(companionsError) throw new Error(companionsError.message);
    
    // Preserve the order of companions as they were in the session history
    return companionIds.map(id => 
        companions.find(companion => companion.id === id)
    ).filter(Boolean); // Remove any undefined values
}

export const getUserSessions = async (userId: string, limit = 10) => {
    const supabase = createSupabaseClient();
    
    // First, get the user's session history entries
    const { data: sessions, error: sessionsError } = await supabase
        .from('session_history')
        .select('companion_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if(sessionsError) throw new Error(sessionsError.message);
    
    // If no sessions, return empty array
    if(!sessions || sessions.length === 0) {
        return [];
    }
    
    // Extract companion IDs
    const companionIds = sessions.map(session => session.companion_id);
    
    // Then fetch the actual companion data
    const { data: companions, error: companionsError } = await supabase
        .from('companions')
        .select('*')
        .in('id', companionIds);
        
    if(companionsError) throw new Error(companionsError.message);
    
    // Preserve the order of companions as they were in the session history
    return companionIds.map(id => 
        companions.find(companion => companion.id === id)
    ).filter(Boolean); // Remove any undefined values
}

export const getUserCompanions = async (userId: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('author', userId)

    if(error) throw new Error(error.message);

    return data;
}

export const newCompanionPermissions = async () => {
    const { userId, has } = await auth();
    const supabase = createSupabaseClient();

    let limit = 0;

    if(has({ plan: 'pro' })) {
        return true;
    } else if(has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if(has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const { data, error } = await supabase
        .from('companions')
        .select('id', { count: 'exact' })
        .eq('author', userId)

    if(error) throw new Error(error.message);

    const companionCount = data?.length;

    if(companionCount >= limit) {
        return false
    } else {
        return true;
    }
}
