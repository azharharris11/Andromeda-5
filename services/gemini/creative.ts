
import { Type } from "@google/genai";
import { ProjectContext, CreativeFormat, AdCopy, CreativeConcept, GenResult, StoryOption, BigIdeaOption, MechanismOption } from "../../types";
import { ai, extractJSON } from "./client";

export const generateSalesLetter = async (
  project: ProjectContext,
  story: StoryOption,
  bigIdea: BigIdeaOption,
  mechanism: MechanismOption,
  hook: string
): Promise<GenResult<string>> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    ROLE: Direct Response Copywriter (Long Form / Advertorial Specialist).
    
    TASK: Write a high-converting Sales Letter (or long-form Facebook Ad) that connects all the strategic dots.
    
    STRATEGY STACK:
    1. HOOK: "${hook}" (Grab attention).
    2. STORY: "${story.narrative}" (Emotional Connection/Empathy).
    3. THE SHIFT (Big Idea): "${bigIdea.headline}" - "${bigIdea.concept}" (Destroys old belief).
    4. THE SOLUTION (Mechanism): "${mechanism.scientificPseudo}" - "${mechanism.ums}" (The new logic).
    5. OFFER: ${project.offer} for ${project.productName}.
    
    TONE: Persuasive, storytelling-based, logical yet emotional.
    FORMAT: Markdown. Use bolding for emphasis. Keep paragraphs short (1-2 sentences).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return {
    data: response.text || "",
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateCreativeConcept = async (
  project: ProjectContext, 
  personaName: string, 
  angle: string, 
  format: CreativeFormat
): Promise<GenResult<CreativeConcept>> => {
  const model = "gemini-2.5-flash";

  const awareness = project.marketAwareness || "Problem Aware";
  
  let awarenessInstruction = "";
  if (awareness.includes("Unaware") || awareness.includes("Problem")) {
      awarenessInstruction = `AWARENESS: LOW. Focus on SYMPTOM. Use Pattern Interrupt.`;
  } else if (awareness.includes("Solution")) {
      awarenessInstruction = `AWARENESS: MEDIUM. Focus on MECHANISM and SOCIAL PROOF.`;
  } else {
      awarenessInstruction = `AWARENESS: HIGH. Focus on URGENCY and OFFER.`;
  }

  const prompt = `
    # Role: Creative Director (The Pattern Interrupt Specialist)

    **SABRI SUBY'S "ANTI-COMPETITOR" RULE:**
    1. Imagine the "Standard Boring Ad" for this industry (e.g., smiling stock photos, clean studio lighting).
    2. THROW IT IN THE TRASH.
    3. Do the EXACT OPPOSITE. If they go high, we go low (lo-fi). If they are polished, we are raw.
    
    **INPUTS:**
    Product: ${project.productName}
    Winning Insight: ${angle}
    Format: ${format}
    Context: ${project.targetCountry}
    ${awarenessInstruction}
    
    **CRITICAL FOR FORMAT '${format}':**
    *   If 'Long Text' or 'Story': You MUST describe a vertical, candid, authentic shot (e.g., Selfie in car, Mirror selfie, Handheld). NO STOCK PHOTOS. The image description must explicitly mention WHERE the text overlay will go (e.g., "White text box above head").
    *   If 'Ugly Visual' or 'Pattern Interrupt': Describe a chaotic, low-fidelity scene.
    
    **TASK:**
    Create a concept that VIOLATES the expectations of the feed.
    
    **OUTPUT REQUIREMENTS (JSON):**

    **1. Congruence Rationale:**
    Explain WHY this image matches this specific headline. "The headline promises X, so the image shows X happening."

    **2. TECHNICAL PROMPT (technicalPrompt):**
    A STRICT prompt for the Image Generator. 
    *   If format is text-heavy (e.g. Twitter, Notes, Story), describe the BACKGROUND VIBE (Candid/Blurry) and UI details (Instagram Fonts, Text Bubbles).
    *   If format is visual (e.g. Photography), the SUBJECT ACTION must match the HOOK.

    **3. SCRIPT DIRECTION (copyAngle):**
    Instructions for the copywriter.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualScene: { type: Type.STRING, description: "Director's Note" },
          visualStyle: { type: Type.STRING, description: "Aesthetic vibe" },
          technicalPrompt: { type: Type.STRING, description: "Strict prompt for Image Gen" },
          copyAngle: { type: Type.STRING, description: "Strategy for the copywriter" },
          rationale: { type: Type.STRING, description: "Strategic Hypothesis" },
          congruenceRationale: { type: Type.STRING, description: "Why the Image proves the Text (The Jeans Rule)" },
          hookComponent: { type: Type.STRING, description: "The Visual Hook element" },
          bodyComponent: { type: Type.STRING, description: "The Core Argument element" },
          ctaComponent: { type: Type.STRING, description: "The Call to Action element" }
        },
        required: ["visualScene", "visualStyle", "technicalPrompt", "copyAngle", "rationale", "congruenceRationale"]
      }
    }
  });

  return {
    data: extractJSON(response.text || "{}"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateAdCopy = async (
  project: ProjectContext, 
  persona: any, 
  concept: CreativeConcept
): Promise<GenResult<AdCopy>> => {
  const model = "gemini-2.5-flash";
  const country = project.targetCountry || "USA";
  const isIndo = country.toLowerCase().includes("indonesia");

  // SYSTEM: TONE CALIBRATION (FEW-SHOT PROMPTING)
  let toneInstruction = "";
  
  if (project.brandCopyExamples && project.brandCopyExamples.length > 10) {
      // FEW-SHOT MODE (HIGH QUALITY)
      toneInstruction = `
        **CRITICAL TONE CALIBRATION (MIMIC THIS STYLE EXACTLY):**
        I have provided examples of the client's winning copy below. 
        Study the sentence length, slang usage, capitalization, and emotional density.
        Your output MUST sound like it was written by the same person.
        
        === CLIENT EXAMPLES START ===
        ${project.brandCopyExamples}
        === CLIENT EXAMPLES END ===
        
        Do NOT revert to generic AI defaults. Use the examples above as your "Style Source of Truth".
      `;
  } else {
      // ZERO-SHOT FALLBACK (LOWER QUALITY)
      if (isIndo) {
          toneInstruction = `
            STYLE: "Bahasa Gaul" (Authentic Indonesian Social Media Slang).
            ANTI-ROBOT RULES:
            1. HARAM WORDS (Do NOT use): "Sobat", "Kawan", "Halo", "Apakah", "Solusi".
            2. USE PARTICLES: "sih", "dong", "deh", "kan", "banget", "malah", "kok".
            3. PRONOUNS: Use "Aku/Kamu" (Soft) or "Gue/Lo" (Edgy). Never "Anda".
            4. TONE: Like a best friend gossiping or ranting.
          `;
      } else {
          toneInstruction = `STYLE: Conversational, Authentic, Native Speaker level.`;
      }
  }

  // SYSTEM: HEADLINE CONTEXT LIBRARY (THE STATIC AD RULES)
  const prompt = `
    # Role: Senior Direct Response Copywriter (Static Ad Specialist)

    **MANDATORY INSTRUCTION:**
    ${toneInstruction}
    TARGET COUNTRY: ${country}.

    **THE HEADLINE CONTEXT LIBRARY (RULES):**
    1.  **Assume No One Knows You:** Treat the audience as COLD. Do not be vague.
    2.  **Clear > Clever:** Clarity drives conversions.
    3.  **The "So That" Test:** Sell the AFTER state.
    4.  **Call Out the Audience/Pain:** Flag down the user immediately.
    5.  **Scannability:** Under 7 words. High contrast thought.
    6.  **Visual Hierarchy:** The headline MUST match the image scene described below.

    **STRATEGY CONTEXT:**
    Product: ${project.productName}
    Offer: ${project.offer}
    Target: ${persona.name}
    
    **CONGRUENCE CONTEXT (IMAGE SCENE):**
    Visual Scene: "${concept.visualScene}"
    Rationale: "${concept.congruenceRationale}"
    
    **TASK:**
    Write the ad copy applying the rules above.

    **OUTPUT:**
    1. Primary Text: The main caption. Match the tone to the identity of the persona.
    2. Headline: Apply the "So That" test. Max 7 words. MUST be congruent with the Visual Scene.
    3. CTA: Clear instruction.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryText: { type: Type.STRING },
          headline: { type: Type.STRING },
          cta: { type: Type.STRING }
        },
        required: ["primaryText", "headline", "cta"]
      }
    }
  });

  return {
    data: extractJSON(response.text || "{}"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};
