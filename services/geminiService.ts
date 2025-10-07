
import { GoogleGenAI, Type } from "@google/genai";
import type { SaintInfo, BibleVerse, SaintValidation, EucharisticMiracle, MiracleSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const saintInfoSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The full name of the saint, including titles like "St.".' },
    feastDay: { type: Type.STRING, description: 'The feast day of the saint (e.g., "October 4").' },
    patronage: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of things the saint is a patron of.' },
    summary: { type: Type.STRING, description: 'A one-paragraph summary of the saint\'s life and significance.' },
    biography: { type: Type.STRING, description: 'A detailed biography of the saint, covering their life, major events, and legacy. Should be at least 3-4 paragraphs long.' },
    quotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of 2-3 notable quotes attributed to the saint.' }
  },
  required: ["name", "feastDay", "patronage", "summary", "biography", "quotes"],
};

const saintValidationSchema = {
  type: Type.OBJECT,
  properties: {
    isSaint: { type: Type.BOOLEAN, description: 'True if the person is a recognized (canonized or beatified) Catholic Saint, false otherwise.' },
    reasoning: { type: Type.STRING, description: 'A brief, one-sentence explanation for the decision, especially if false (e.g., "This person is a historical figure but not a Catholic Saint.").' }
  },
  required: ["isSaint", "reasoning"],
};

const bibleSearchSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            reference: { type: Type.STRING, description: 'The Bible reference for the verse (e.g., "John 3:16").' },
            text: { type: Type.STRING, description: 'The full text of the verse.' }
        },
        required: ["reference", "text"]
    }
};

const getLanguageInstruction = (language: string) => {
    return language === 'es' ? 'All responses must be in Spanish.' : 'All responses must be in English.';
};

export const getSaintInfo = async (saintName: string, language: string): Promise<SaintInfo> => {
  try {
    // Step 1: Validate if the name corresponds to a Catholic Saint
    const validationResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Is the person "${saintName}" a recognized Catholic Saint?`,
        config: {
            systemInstruction: `You are a strict Catholic historian. Your only job is to validate if a name corresponds to a canonized or beatified Catholic Saint. Be precise. If it's a different figure (e.g., a king, a philosopher, a saint from another denomination), you must respond with false. ${getLanguageInstruction(language)}`,
            responseMimeType: "application/json",
            responseSchema: saintValidationSchema,
        },
    });

    const validationJsonText = validationResponse.text.trim();
    const validationResult = JSON.parse(validationJsonText) as SaintValidation;

    if (!validationResult.isSaint) {
        // Use the reasoning from the model for a more informative error
        throw new Error(validationResult.reasoning); 
    }

    // Step 2: If validation passes, get the detailed information
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a detailed biography and key information for Saint ${saintName}.`,
      config: {
        systemInstruction: `You are a knowledgeable and respectful Catholic historian and theologian. Provide accurate, reverent, and concise information about Catholic saints. The tone should be informative and inspiring, suitable for a general Catholic audience. ${getLanguageInstruction(language)}`,
        responseMimeType: "application/json",
        responseSchema: saintInfoSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as SaintInfo;

  } catch (error) {
    console.error("Error in getSaintInfo flow:", error);
    // Re-throw the specific error from validation or a generic one for other issues
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unexpected error occurred while fetching saint information.");
  }
};

export const generateSaintImage = async (saintName: string, language: string): Promise<string> => {
  try {
    const prompt = language === 'es'
        ? `Un retrato etéreo y reverente de San ${saintName}, al estilo de una pintura religiosa clásica. El santo debe ser representado con la iconografía tradicional asociada a él. Ambiente sereno e inspirador.`
        : `An ethereal and reverent portrait of Saint ${saintName}, in the style of a classical religious painting. The saint should be depicted with traditional iconography associated with them. Serene and inspiring atmosphere.`;
        
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating saint image:", error);
    throw new Error("Failed to generate an image for the saint. This feature may be temporarily unavailable.");
  }
};

export const getScripture = async (book: string, chapter: string, language: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide the full text for the book of ${book}, chapter ${chapter}.`,
            config: {
                systemInstruction: `You are a scripture reference tool. Use the New American Bible, Revised Edition (NABRE) for English requests, and the Biblia de Jerusalén Latinoamericana for Spanish requests. Format the output as a single string, with each verse prefixed by its number on a new line. Example: '1 In the beginning...\\n2 And the earth was...'. Do not include any other commentary or introductory text. ${getLanguageInstruction(language)}`,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error fetching scripture:", error);
        throw new Error("Failed to retrieve the specified scripture. Please check the book and chapter.");
    }
};

export const searchBible = async (query: string, language: string): Promise<BibleVerse[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Search the Bible for the phrase: "${query}"`,
            config: {
                systemInstruction: `You are a scripture search tool. Use the NABRE for English and Biblia de Jerusalén Latinoamericana for Spanish. Return a JSON array of objects, where each object has 'reference' and 'text'. If no results are found, return an empty array. ${getLanguageInstruction(language)}`,
                responseMimeType: "application/json",
                responseSchema: bibleSearchSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as BibleVerse[];
    } catch (error) {
        console.error("Error searching Bible:", error);
        throw new Error("Failed to perform the Bible search. Please try a different query.");
    }
};

export const getEucharisticMiracleInfo = async (query: string, language: string): Promise<EucharisticMiracle> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide a detailed summary of the Eucharistic miracle of "${query}". Prioritize information from reliable Catholic sources.`,
            config: {
                systemInstruction: `You are a Catholic historian specializing in Eucharistic miracles. Your response should be a clear, factual summary. Use the grounding search results to formulate your answer. ${getLanguageInstruction(language)}`,
                tools: [{ googleSearch: {} }],
            },
        });

        const summary = response.text.trim();
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: MiracleSource[] = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri && web.title)
            .map((web: any) => ({ uri: web.uri, title: web.title }));

        if (!summary) {
            throw new Error("Could not retrieve information for this miracle. It may not be a recognized Eucharistic miracle.");
        }

        return { summary, sources };

    } catch (error) {
        console.error("Error fetching Eucharistic miracle info:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred while researching the miracle.");
    }
};
