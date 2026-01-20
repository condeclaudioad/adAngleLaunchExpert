import { getSupabase, getCurrentUser } from './supabaseClient';
import { Angle, ImageAnalysis } from '../types';

export const saveAnalysisToDb = async (analysis: ImageAnalysis) => {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const { error } = await getSupabase()
            .from('visual_analyses')
            .insert({
                user_id: user.id,
                angle_detected: analysis.angleDetected,
                visual_elements: analysis.visualElements,
                copy_text: analysis.copy,
                colors: analysis.colors,
                composition: analysis.composition,
                emotions: analysis.emotions
            });

        if (error) {
            console.error('Error saving analysis to DB:', error);
        } else {
            console.log('✅ Analysis saved to DB');
        }
    } catch (e) {
        console.error('Exception saving analysis:', e);
    }
};

export const saveAngleToDb = async (angle: Angle) => {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        // generated_angles might generate duplicates if we just insert blindly, 
        // but for now we just append history.
        const { error } = await getSupabase()
            .from('generated_angles')
            .insert({
                user_id: user.id,
                name: angle.name,
                description: angle.description,
                hook: angle.hook,
                emotion: angle.emotion,
                visuals: angle.visuals
            });

        if (error) {
            console.error('Error saving angle to DB:', error);
        }
    } catch (e) {
        console.error('Exception saving angle:', e);
    }
};

export const getExistingAngles = async (): Promise<Angle[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        const { data, error } = await getSupabase()
            .from('generated_angles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // Get last 100 for context

        if (error) {
            console.error('Error fetching angles from DB:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id, // DB UUID
            name: d.name,
            description: d.description || "",
            hook: d.hook,
            emotion: d.emotion || "",
            visuals: d.visuals || "",
            selected: false
        }));
    } catch (e) {
        console.error('Exception fetching angles:', e);
        return [];
    }
};
