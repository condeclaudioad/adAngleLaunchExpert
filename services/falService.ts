import { FAL_MODEL } from "../constants";

// Using raw fetch to avoid complex dependency injection in this environment
// In a real app, use fal-serverless-client

export const generateImageFal = async (prompt: string, falKey: string): Promise<string> => {
  if (!falKey) throw new Error("FAL_KEY is missing");

  try {
    const response = await fetch(`https://fal.run/${FAL_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "square_hd", // Recraft V3 specific
        style: "digital_illustration", // As requested
        colors: [] 
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Fal.ai generation failed");
    }

    const data = await response.json();
    // Recraft usually returns { images: [{ url: ... }] }
    if (data.images && data.images.length > 0) {
      return data.images[0].url;
    }
    throw new Error("No image URL in response");

  } catch (error) {
    console.error("Fal Gen Error:", error);
    throw error;
  }
};
