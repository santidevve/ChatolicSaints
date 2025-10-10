import { GoogleGenAI, Type } from "@google/genai";
import type { SaintInfo, BibleVerse, SaintValidation, EucharisticMiracle, MiracleSource, ChapterVerse, Chant, SaintOfTheDay, GospelReading } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY! });

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

const saintSuggestionsSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
    description: "A list of up to 5 potential saint names that match the user's partial query."
};

const saintsOfTheDaySchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'The full name of the saint, including "St.".' },
            summary: { type: Type.STRING, description: 'A single, concise sentence summarizing the saint\'s significance or key life event.' }
        },
        required: ["name", "summary"]
    },
    description: "A list of Catholic saints whose feast day is today. Can be one or more saints. If there are no major saints, return an empty array."
};

const gospelReadingSchema = {
    type: Type.OBJECT,
    properties: {
        reference: { type: Type.STRING, description: 'The full scripture reference for the Gospel reading (e.g., "John 3:16-21").' },
        text: { type: Type.STRING, description: 'The full text of the Gospel reading for the day.' }
    },
    required: ["reference", "text"]
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

const bibleChapterSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            verse: { type: Type.STRING, description: 'The verse number (e.g., "1", "2-3").' },
            text: { type: Type.STRING, description: 'The full text of the verse.' }
        },
        required: ["verse", "text"]
    }
};

const chantListSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            number: { type: Type.STRING, description: 'The song number (e.g., "A1").' },
            title: { type: Type.STRING, description: 'The title of the song.' }
        },
        required: ["number", "title"]
    }
};

const getLanguageInstruction = (language: string) => {
    return language === 'es' ? 'All responses must be in Spanish.' : 'All responses must be in English.';
};

export const getGospelOfTheDay = async (language: string): Promise<GospelReading> => {
    const today = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `What is the Catholic Gospel reading for today, ${today}?`,
            config: {
                systemInstruction: `You are a Catholic resource providing the daily Gospel reading according to the General Roman Calendar lectionary. Provide the scripture reference and the full text. Use the New American Bible, Revised Edition (NABRE) for English and the Biblia de Jerusalén Latinoamericana for Spanish. ${getLanguageInstruction(language)}`,
                responseMimeType: "application/json",
                responseSchema: gospelReadingSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as GospelReading;
    } catch (error) {
        console.error("Error fetching Gospel of the day:", error);
        throw new Error("Could not retrieve the Gospel of the day.");
    }
};

export const getSaintsOfTheDay = async (language: string): Promise<SaintOfTheDay[]> => {
    const today = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', day: 'numeric' });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Who are the Catholic saints of the day for ${today}?`,
            config: {
                systemInstruction: `You are a Catholic historian providing information from the General Roman Calendar. Your task is to list the saint(s) celebrated today. Provide the response as a JSON array of objects, each containing the saint's name and a one-sentence summary. If there are multiple saints (e.g., companions), list them. If it's a minor feast day or no major saint is celebrated, you can return an empty array. ${getLanguageInstruction(language)}`,
                responseMimeType: "application/json",
                responseSchema: saintsOfTheDaySchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SaintOfTheDay[];
    } catch (error) {
        console.error("Error fetching saints of the day:", error);
        throw new Error("Could not retrieve the saints of the day.");
    }
};

export const getSaintSuggestions = async (query: string, language: string): Promise<string[]> => {
    if (query.length < 3) {
        return [];
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the partial query "${query}", provide a list of up to 5 likely Catholic Saint names.`,
            config: {
                systemInstruction: `You are a search suggestion engine for a Catholic Saints app. Provide a JSON array of saint names that are a close match to the user's query. Prioritize well-known saints. If the query is ambiguous, provide a few options. Return an empty array if no likely matches are found. ${getLanguageInstruction(language)}`,
                responseMimeType: "application/json",
                responseSchema: saintSuggestionsSchema,
                thinkingConfig: { thinkingBudget: 0 } // Optimize for low latency
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as string[];
    } catch (error) {
        console.error("Error fetching saint suggestions:", error);
        return []; // Return empty array on error to not break UI
    }
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

export const getScripture = async (book: string, chapter: string, language: string): Promise<ChapterVerse[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide the full text for the book of ${book}, chapter ${chapter}.`,
            config: {
                systemInstruction: `You are a scripture reference tool. Use the New American Bible, Revised Edition (NABRE) for English requests, and the Biblia de Jerusalén Latinoamericana for Spanish requests. Return the result as a JSON array of objects, where each object has a "verse" string and a "text" string. Do not include any other commentary or introductory text. ${getLanguageInstruction(language)}`,
                responseMimeType: "application/json",
                responseSchema: bibleChapterSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ChapterVerse[];
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

export const translateText = async (text: string, targetLanguage: 'en' | 'es'): Promise<string> => {
    const languageName = targetLanguage === 'es' ? 'Spanish' : 'English';
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Translate the following text to ${languageName}:\n\n---\n\n${text}`,
            config: {
                systemInstruction: `You are a highly skilled, professional translator. Your sole purpose is to provide a faithful and natural-sounding translation of the given text into the target language. Do not add any commentary, notes, or introductory phrases. Only output the translated text.`,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        throw new Error("Failed to translate the text.");
    }
};

export const generateMiracleImage = async (miracleName: string, language: string): Promise<string> => {
    try {
        const prompt = language === 'es'
            ? `Una representación artística y reverente del milagro Eucarístico de ${miracleName}. Estilo de arte sacro, con un enfoque en el misterio y la santidad del evento.`
            : `A reverent, artistic depiction of the Eucharistic miracle of ${miracleName}. Sacred art style, focusing on the mystery and holiness of the event.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            // Return empty string on failure, allowing text to still be shown
            return "";
        }
    } catch (error) {
        console.error("Error generating miracle image:", error);
        // Fail gracefully
        return "";
    }
};

export const getEucharisticMiracleInfo = async (query: string, language: string): Promise<EucharisticMiracle> => {
    try {
        const [textResponse, imageUrl] = await Promise.all([
            ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Provide a detailed summary of the Eucharistic miracle of "${query}". Prioritize information from reliable Catholic sources.`,
                config: {
                    systemInstruction: `You are a Catholic historian specializing in Eucharistic miracles. Your response should be a clear, factual summary. Use the grounding search results to formulate your answer. ${getLanguageInstruction(language)}`,
                    tools: [{ googleSearch: {} }],
                },
            }),
            generateMiracleImage(query, language)
        ]);
        
        const summary = textResponse.text.trim();
        const groundingChunks = textResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: MiracleSource[] = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri && web.title)
            .map((web: any) => ({ uri: web.uri, title: web.title }));

        if (!summary) {
            throw new Error("Could not retrieve information for this miracle. It may not be a recognized Eucharistic miracle.");
        }

        return { summary, sources, imageUrl };

    } catch (error) {
        console.error("Error fetching Eucharistic miracle info:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred while researching the miracle.");
    }
};

export const askAboutScripture = async (context: string, question: string, language: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following scripture: "${context}", please answer this question: "${question}"`,
            config: {
                systemInstruction: `You are a knowledgeable and respectful Catholic theologian. Provide a clear, insightful, and concise answer to the user's question based *only* on the provided scripture context and your theological knowledge. Do not reference external non-scriptural sources unless absolutely necessary. Keep the tone helpful and reverent. ${getLanguageInstruction(language)}`,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error asking about scripture:", error);
        throw new Error("Failed to get an answer from the AI. Please try again.");
    }
};

export const generateBibleChapterImage = async (book: string, chapter: string, language: string): Promise<string> => {
    try {
        const prompt = language === 'es'
            ? `Una representación artística y reverente de los temas principales de ${book}, Capítulo ${chapter}. Estilo de arte sacro, como una pintura clásica, enfocándose en la narrativa o el mensaje central del capítulo.`
            : `A reverent, artistic depiction of the main themes from ${book}, Chapter ${chapter}. Sacred art style, like a classical painting, focusing on the chapter's central narrative or message.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return ""; // Return empty string on failure
    } catch (error) {
        console.error("Error generating Bible chapter image:", error);
        return ""; // Fail gracefully
    }
};

export const getChantList = async (language: string): Promise<Chant[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Extract the list of all chants from the application at 'https://app.resucito.es/home'. The app contains a comprehensive list of neocatechumenal chants. Return a JSON array of objects, where each object has 'number' and 'title'.",
            config: {
                systemInstruction: `You are a web data extractor. Your task is to parse the provided URL and return a structured list of songs. The title should be cleaned of any extra numbering. ${getLanguageInstruction(language)}`,
                responseMimeType: "application/json",
                responseSchema: chantListSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Chant[];
    } catch (error) {
        console.error("Error fetching chant list:", error);
        throw new Error("Failed to retrieve the list of chants.");
    }
};

export const getChantLyrics = async (chantTitle: string, language: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide the lyrics for the chant "${chantTitle}". You can use the songbook at 'https://app.resucito.es/home' as a primary reference.`,
            config: {
                systemInstruction: `You are a helpful assistant providing song lyrics. Format the lyrics clearly with line breaks. Do not include chords or any other annotations, just the text of the song. ${getLanguageInstruction(language)}`,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error fetching chant lyrics:", error);
        throw new Error("Failed to retrieve the lyrics for this chant.");
    }
};