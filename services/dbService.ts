import { getSupabase, getCurrentUser } from './supabaseClient';
import { Angle, ImageAnalysis, Business, GeneratedImage } from '../types';

// ——————————————— VISUAL ANALYSIS ———————————————

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

        if (error) console.error('Error saving analysis to DB:', error);
    } catch (e) {
        console.error('Exception saving analysis:', e);
    }
};

export const getVisualAnalyses = async (): Promise<ImageAnalysis[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        const { data, error } = await getSupabase()
            .from('visual_analyses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching analyses:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            angleDetected: d.angle_detected,
            visualElements: d.visual_elements || [],
            copy: d.copy_text,
            colors: d.colors || [],
            composition: d.composition,
            emotions: d.emotions || []
        }));
    } catch (e) {
        console.error('Exception fetching analyses:', e);
        return [];
    }
}


export const deleteAnalysisFromDb = async (id: string) => {
    try {
        const { error } = await getSupabase()
            .from('visual_analyses')
            .delete()
            .match({ id });
        if (error) console.error('Error deleting analysis:', error);
    } catch (e) {
        console.error('Exception deleting analysis:', e);
    }
};

// ——————————————— ANGLES ———————————————

export const saveAngleToDb = async (angle: Angle) => {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const { error } = await getSupabase()
            .from('generated_angles')
            .upsert({
                id: angle.id, // Ensure we upsert by ID
                user_id: user.id,
                name: angle.name,
                description: angle.description,
                hook: angle.hook,
                emotion: angle.emotion,
                visuals: angle.visuals,
                ad_copy: angle.adCopy, // New field
                selected: angle.selected // New field
            }, { onConflict: 'id' });

        if (error) console.error('Error saving angle to DB:', error);
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
            .limit(100);

        if (error) {
            console.error('Error fetching angles from DB:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description || "",
            hook: d.hook,
            emotion: d.emotion || "",
            visuals: d.visuals || "",
            adCopy: d.ad_copy || "",
            selected: d.selected || false
        }));
    } catch (e) {
        console.error('Exception fetching angles:', e);
        return [];
    }
}


export const deleteAngleFromDb = async (id: string) => {
    try {
        const { error } = await getSupabase()
            .from('generated_angles')
            .delete()
            .match({ id });
        if (error) console.error('Error deleting angle:', error);
    } catch (e) {
        console.error('Exception deleting angle:', e);
    }
};

export const deleteAllAnglesFromDb = async () => {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        const { error } = await getSupabase()
            .from('generated_angles')
            .delete()
            .eq('user_id', user.id);
        if (error) console.error('Error deleting all angles:', error);
    } catch (e) {
        console.error('Exception deleting all angles:', e);
    }
};

// ——————————————— BUSINESSES ———————————————

export const updateBusinessInDb = async (id: string, updates: Partial<Business>) => {
    try {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.knowledgeBase !== undefined) payload.knowledge_base = updates.knowledgeBase;
        if (updates.branding !== undefined) payload.branding = updates.branding;
        // We do NOT save generated_angles to the business JSONB anymore to avoid bloat.
        // They live in their own table 'generated_angles'.

        if (Object.keys(payload).length === 0) return;

        const { error } = await getSupabase()
            .from('businesses')
            .update(payload)
            .match({ id });

        if (error) console.error('Error updating business:', error);
    } catch (e) {
        console.error('Exception updating business:', e);
    }
};

export const saveBusinessToDb = async (business: Business) => {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Upsert based on ID
        const { error } = await getSupabase()
            .from('businesses')
            .upsert({
                id: business.id, // Using the text ID generated on frontend
                user_id: user.id,
                name: business.name,
                knowledge_base: business.knowledgeBase,
                branding: business.branding
                // generated_angles: business.generatedAngles // REMOVED to prevent timeouts
            });

        if (error) console.error('Error saving business:', error);
    } catch (e) {
        console.error('Exception saving business:', e);
    }
};

export const getBusinessesFromDb = async (): Promise<Business[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        const { data, error } = await getSupabase()
            .from('businesses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching businesses:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            createdAt: new Date(d.created_at).getTime(),
            knowledgeBase: d.knowledge_base,
            branding: d.branding,
            generatedAngles: d.generated_angles,
            ownerEmail: user.email
        }));
    } catch (e) {
        console.error('Exception fetching businesses:', e);
        return [];
    }
};

export const deleteBusinessFromDb = async (id: string) => {
    try {
        const { error } = await getSupabase()
            .from('businesses')
            .delete()
            .match({ id });
        if (error) console.error('Error deleting business:', error);
    } catch (e) {
        console.error('Exception deleting business:', e);
    }
};

// ——————————————— IMAGES ———————————————

export const saveImageToDb = async (img: GeneratedImage) => {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const { error } = await getSupabase()
            .from('generated_images')
            .upsert({
                id: img.id,
                user_id: user.id,
                angle_id: img.angleId,
                url: img.url, // Storing Base64 or URL
                prompt: img.prompt,
                type: img.type,
                parent_id: img.parentId,
                status: img.status,
                approval_status: img.approvalStatus
            });

        if (error) console.error('Error saving image:', error);
    } catch (e) {
        console.error('Exception saving image:', e);
    }
};

export const getImagesFromDb = async (): Promise<GeneratedImage[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        const { data, error } = await getSupabase()
            .from('generated_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching images:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            angleId: d.angle_id,
            url: d.url,
            prompt: d.prompt,
            type: d.type as 'master' | 'variation',
            parentId: d.parent_id,
            status: d.status as any,
            approvalStatus: d.approval_status as any
        }));
    } catch (e) {
        console.error('Exception fetching images:', e);
        return [];
    }
};

export const deleteImageFromDb = async (id: string) => {
    try {
        const { error } = await getSupabase()
            .from('generated_images')
            .delete()
            .match({ id });
        if (error) console.error('Error deleting image:', error);
    } catch (e) {
        console.error('Exception deleting image:', e);
    }
};
