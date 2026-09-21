import OpenAI from 'openai';
import { z } from 'zod';
import dotenv from 'dotenv';
import { zodResponseFormat } from 'openai/helpers/zod';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Zod schema for defining the exact structure of output from OpenAI
const ExtractionSchema = z.object({
    entities: z.array(z.object({
        id: z.string().describe("A unique UUID for the entity"),
        name: z.string().describe("The name or primary identifier of the entity"),
        type: z.enum(["Person", "Phone", "Account", "Location", "Organization", "Vehicle", "Event"]).describe("The category of the entity"),
        role: z.string().optional().describe("The role played by the entity in the text"),
        riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().describe("Estimated risk level based on context"),
        properties: z.array(z.object({
            key: z.string().describe("Property name (e.g., address, bank_name)"),
            value: z.string().describe("Property value")
        })).optional().describe("Additional extracted properties")
    })),
    relationships: z.array(z.object({
        sourceId: z.string().describe("The ID of the source entity"),
        targetId: z.string().describe("The ID of the target entity"),
        type: z.enum(["COMMUNICATES_WITH", "TRANSFERRED_MONEY_TO", "ASSOCIATED_WITH", "OWNS_ACCOUNT", "USES_PHONE", "RESIDES_AT", "DIRECTS", "ATTENDED", "PRIOR_CASE"]).describe("The type of relationship"),
        evidence: z.string().describe("A snippet from the text supporting this relationship"),
        weight: z.number().min(0).max(1).optional().describe("Confidence score for the relationship")
    }))
});

/**
 * Extracts entities and relationships from unstructured text using OpenAI's Structured Outputs.
 */
export const extractNetworkData = async (text: string) => {
    try {
        const response = await openai.beta.chat.completions.parse({
            model: 'gpt-4o-mini', // or 'gpt-4o'
            messages: [
                {
                    role: 'system',
                    content: `You are an expert intelligence analyst extracting criminal network data from unstructured text using the POLE (Person, Object, Location, Event) model.
                    
Your task is to identify:
1. Entities: People, phone numbers, bank accounts, locations, organizations, vehicles, and events.
2. Relationships: How these entities are connected.

Guidelines:
- Assign UUIDs to entities to link them in relationships.
- Assign a riskLevel (HIGH, MEDIUM, LOW) to entities based on their involvement.
- For relationships, provide an 'evidence' string (exact or close snippet from text).
- ONLY return valid JSON conforming to the provided schema.`
                },
                {
                    role: 'user',
                    content: `Please extract entities and relationships from the following intelligence report:\n\n${text}`
                }
            ],
            response_format: zodResponseFormat(ExtractionSchema, "network_extraction"),
            temperature: 0.1 // Low temperature for consistent extraction
        });

        const parsedResult = response.choices[0].message.parsed;
        
        if (!parsedResult) {
            throw new Error("Failed to parse the extraction output.");
        }
        
        return parsedResult;
    } catch (error) {
        console.error("Error extracting network data:", error);
        throw error;
    }
};

/**
 * Generates an intelligence summary based on the graph data of a case.
 */
export const generateIntelligenceSummary = async (graphData: any) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert intelligence analyst. Summarize the provided criminal network graph data into a concise, professional intelligence briefing.'
                },
                {
                    role: 'user',
                    content: `Please provide an intelligence summary for the following network data:\n\n${JSON.stringify(graphData)}`
                }
            ]
        });
        
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error generating summary:", error);
        throw error;
    }
};
