
import { GoogleGenAI, Modality } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Return only the base64 part, without the data URI prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

const dataUrlToParts = (dataUrl: string): { base64Data: string, mimeType: string } => {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) throw new Error("Invalid data URL format");
    
    const header = parts[0];
    const base64Data = parts[1];

    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        throw new Error("Could not extract MIME type from data URL");
    }
    const mimeType = mimeTypeMatch[1];
    
    return { base64Data, mimeType };
}


export const editImageWithGemini = async (image: File | string, prompt: string): Promise<{ imageUrl: string, text: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let base64Data: string;
    let mimeType: string;

    if (typeof image === 'string') {
        // Handle both blob URLs (initial image) and data URLs (edited images)
        if (image.startsWith('blob:')) {
            const response = await fetch(image);
            const blob = await response.blob();
            const file = new File([blob], "image", { type: blob.type });
            base64Data = await fileToBase64(file);
            mimeType = file.type;
        } else { // It's a data URL
            const parts = dataUrlToParts(image);
            base64Data = parts.base64Data;
            mimeType = parts.mimeType;
        }
    } else { // It's a File object
        base64Data = await fileToBase64(image);
        mimeType = image.type;
    }

    let response;
    try {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);

        // The SDK might throw an error where the message is a JSON string.
        // We'll try to parse it to provide a more user-friendly message.
        try {
            if (error && typeof error.message === 'string') {
                const errorDetails = JSON.parse(error.message);
                if (errorDetails?.error?.code === 429) {
                    throw new Error("You've exceeded your API quota. Please check your plan and billing details.");
                }
            }
        } catch (e) {
            // The message was not JSON, or it didn't have the expected structure.
            // Fall through to the generic error.
        }
        
        // For any other API error, throw a generic but friendly message.
        throw new Error("An error occurred while communicating with the AI. Please try again later.");
    }

    let newImageBase64: string | null = null;
    let newText = "";
    let newMimeType = mimeType; 

    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                newImageBase64 = part.inlineData.data;
                newMimeType = part.inlineData.mimeType;
            } else if (part.text) {
                newText += part.text;
            }
        }
    } else {
         throw new Error("No valid candidates returned from the API.");
    }
    
    if (!newImageBase64) {
        if (newText) {
             throw new Error(`The AI could not edit the image: "${newText}"`);
        }
        throw new Error("The AI did not return an image. Please try a different prompt.");
    }

    return {
        imageUrl: `data:${newMimeType};base64,${newImageBase64}`,
        text: newText,
    };
};
