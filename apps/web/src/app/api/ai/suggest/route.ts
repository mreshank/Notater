import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const runtime = "edge"; // Use Edge Runtime for speed

export async function POST(req: Request) {
    try {
        const { promptType } = await req.json(); // e.g., "inspire", "chord", "melody"

        const apiKey = process.env.GEMINI_API_KEY;
        console.log("[AI API] Key status:", { 
            exists: !!apiKey, 
            length: apiKey?.length, 
            startsWith: apiKey?.substring(0, 4) + "..." 
        });

        if (!apiKey) {
            return NextResponse.json(
                {
                    title: "API Key Missing",
                    description: "Please set GEMINI_API_KEY in .env.local",
                    bpm: 120,
                    key: "C Major",
                    instruments: ["Synth", "Drums"],
                    genre: "Error"
                },
                { status: 200 } // Return mock data gracefully for now
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `
            You are a creative music producer assistant for a beat maker app.
            Your goal is to suggest ONE unique, short musical idea.
            Output purely valid JSON. No markdown ticks.
            Schema:
            {
                "title": "Creative Title",
                "genre": "Genre Name",
                "bpm": number (60-160),
                "key": "Key (e.g., F Minor)",
                "description": "Short 1-sentence vibe description.",
                "instruments": ["List", "Of", "3-5", "Instruments"],
                "chordProgression": "Optional chord numerals (e.g. i - VI - III - VII)",
                "sequencerPattern": {
                   "kick": [boolean... 16 steps], 
                   "snare": [boolean... 16 steps],
                   "hihat": [boolean... 16 steps],
                   "hihatOpen": [boolean... 16 steps],
                   "clap": [boolean... 16 steps],
                   "tom1": [boolean... 16 steps],
                   "tom2": [boolean... 16 steps],
                   "crash": [boolean... 16 steps],
                   "ride": [boolean... 16 steps]
                },
                "pianoNotes": [
                    { "pitch": "C4", "step": 0, "duration": 4 } // Duration in 16th notes
                ]
            }
        `;

        let userPrompt = "Give me a random cool beat idea.";

        if (promptType === "chord") {
            userPrompt = "Give me a unique chord progression idea for a Lo-Fi or Neo-Soul track.";
        } else if (promptType === "trap") {
            userPrompt = "Give me a dark trap beat idea.";
        } else if (promptType === "drum-roll") {
            userPrompt = "Give me a complex and catchy drum pattern using all available instruments (kick, snare, hihats, toms, cymbals). Make it groovy and professional.";
        }

        const result = await model.generateContent([
            systemInstruction,
            userPrompt
        ]);

        const response = result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        
        const data = JSON.parse(text);

        return NextResponse.json(data);

    } catch (error) {
        console.error("AI API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate idea" },
            { status: 500 }
        );
    }
}
