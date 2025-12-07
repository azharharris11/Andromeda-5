
import { Type } from "@google/genai";
import { ProjectContext, GenResult, StoryOption, BigIdeaOption, MechanismOption } from "../../types";
import { ai, extractJSON } from "./client";

export const generateBigIdeas = async (project: ProjectContext, story: StoryOption): Promise<GenResult<BigIdeaOption[]>> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    ROLE: Direct Response Strategist (Big Idea Developer)
    
    CONTEXT:
    We are targeting a user who connects with this story: "${story.title}" (${story.narrative}).
    Product: ${project.productName}.
    
    TASK:
    Generate 3 "Big Ideas" (New Opportunities) that bridge this story to our solution.
    A Big Idea is NOT a benefit. It is a new way of looking at the problem.
    
    EXAMPLE:
    Story: "I diet but don't lose weight."
    Big Idea: "It's not your willpower, it's your gut biome diversity." (Shift blame -> New mechanism).
    
    OUTPUT JSON:
    - headline: The Big Idea Statement.
    - concept: Explanation of the shift.
    - targetBelief: What old belief are we destroying?
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            headline: { type: Type.STRING },
            concept: { type: Type.STRING },
            targetBelief: { type: Type.STRING }
          },
          required: ["headline", "concept", "targetBelief"]
        }
      }
    }
  });

  const ideas = extractJSON<any[]>(response.text || "[]");
  return {
    data: ideas.map((s, i) => ({ ...s, id: `idea-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateMechanisms = async (project: ProjectContext, bigIdea: BigIdeaOption): Promise<GenResult<MechanismOption[]>> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    ROLE: Product Engineer / Pseudo-Scientist
    
    CONTEXT:
    Big Idea: ${bigIdea.headline}
    Product: ${project.productName}
    
    TASK:
    Define the UMP (Unique Mechanism of Problem) and UMS (Unique Mechanism of Solution).
    This gives the "Logic" to the "Magic".
    
    1. UMP: Why have other methods failed? (e.g., "Standard diets slow down your metabolic rate.")
    2. UMS: How does THIS product solve that specific UMP? (e.g., "We trigger thermogenesis without caffeine.")
    
    OUTPUT JSON (3 Variants):
    - ump: The Root Cause of failure.
    - ums: The New Solution mechanism.
    - scientificPseudo: A catchy name for the mechanism (e.g., "The Dual-Action Protocol").
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            ump: { type: Type.STRING },
            ums: { type: Type.STRING },
            scientificPseudo: { type: Type.STRING }
          },
          required: ["ump", "ums", "scientificPseudo"]
        }
      }
    }
  });

  const mechs = extractJSON<any[]>(response.text || "[]");
  return {
    data: mechs.map((s, i) => ({ ...s, id: `mech-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateHooks = async (project: ProjectContext, bigIdea: BigIdeaOption, mechanism: MechanismOption): Promise<GenResult<string[]>> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    ROLE: Copywriter
    
    Combine these elements into 5 distinct thumb-stopping hooks:
    1. Big Idea: ${bigIdea.headline}
    2. Mechanism: ${mechanism.scientificPseudo} (${mechanism.ums})
    
    Output a simple JSON string array.
  `;
  
   const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return {
    data: extractJSON(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
}

export const generateAngles = async (project: ProjectContext, personaName: string, personaMotivation: string): Promise<GenResult<any[]>> => {
  const model = "gemini-2.5-flash";

  // SYSTEM: Andromeda Strategy (Tier Selection & Prioritization)
  const prompt = `
    You are a Direct Response Strategist applying the "Andromeda Testing Playbook".
    
    CONTEXT:
    Product: ${project.productName}
    Persona: ${personaName}
    Deep Motivation: ${personaMotivation}
    Target Country: ${project.targetCountry}
    
    TASK:
    1. "Gather Data": Brainstorm 10 raw angles/hooks.
    2. "Prioritize": Rank by Market Size, Urgency, Differentiation.
    3. "Assign Tier": Assign a Testing Tier to each angle based on its nature:
       - TIER 1 (Concept Isolation): Big, bold, new ideas. High risk/reward.
       - TIER 2 (Persona Isolation): Specifically tailored to this persona's fear/desire.
       - TIER 3 (Sprint Isolation): A simple iteration or direct offer.
    
    OUTPUT:
    Return ONLY the Top 3 High-Potential Insights.
    
    *For ${project.targetCountry}: Ensure the angles fit the local culture.*
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: "The core Hook/Angle name" },
            painPoint: { type: Type.STRING, description: "The specific problem or insight" },
            psychologicalTrigger: { type: Type.STRING, description: "The principle used (e.g. Loss Aversion)" },
            testingTier: { type: Type.STRING, description: "TIER 1, TIER 2, or TIER 3" },
            hook: { type: Type.STRING, description: "The opening line or concept" }
          },
          required: ["headline", "painPoint", "psychologicalTrigger", "testingTier"]
        }
      }
    }
  });

  return {
    data: extractJSON(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};
