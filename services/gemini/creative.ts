
import { Type } from "@google/genai";
import { ProjectContext, CreativeFormat, AdCopy, CreativeConcept, GenResult, StoryOption, BigIdeaOption, MechanismOption } from "../../types";
import { ai, extractJSON } from "./client";

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
    # Role: Creative Director (Focus: Message & Imagery Congruency)

    **THE GOLDEN RULE OF CONGRUENCE:**
    Ads fail when the image matches the *product* but ignores the *message*.
    
    **INPUTS:**
    Product: ${project.productName}
    Winning Insight (The Message): ${angle}
    Persona: ${personaName}
    Format: ${format}
    Context: ${project.targetCountry}
    ${awarenessInstruction}
    
    **CRITICAL FOR FORMAT '${format}':**
    *   If 'Long Text' or 'Story': You MUST describe a vertical, candid, authentic shot (e.g., Selfie in car, Mirror selfie, Handheld). NO STOCK PHOTOS. The image description must explicitly mention WHERE the text overlay will go (e.g., "White text box above head").
    *   If 'Ugly Visual' or 'Pattern Interrupt': Describe a chaotic, low-fidelity scene.
    
    **TASK:**
    Create a concept where the VISUAL **proves** the HEADLINE.
    
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

export const generateSalesLetter = async (
    project: ProjectContext, 
    story: StoryOption, 
    bigIdea: BigIdeaOption, 
    mechanism: MechanismOption,
    hook: string
): Promise<GenResult<string>> => {
  const model = "gemini-2.5-flash"; 
  const country = project.targetCountry || "USA";
  const isIndo = country.toLowerCase().includes("indonesia");
  
  let langInstruction = "";
  if (isIndo) {
      langInstruction = `
        LANGUAGE: Bahasa Indonesia (Authentic "Gaul" / "Jaksel" Style).
        
        CRITICAL "ANTI-ROBOT" RULES:
        1. NO FORMAL GREETINGS: NEVER start with "Halo sobat", "Hai kawan", "Sobat muda". Just start talking.
        2. NO TEXTBOOK GRAMMAR: 
           - Don't use "Apakah". Use "Emang..." or just "?"
           - Don't use "Saya/Anda". Use "Aku/Kamu" or "Gue/Lo".
           - Don't use "Adalah". Just skip it.
        3. USE PARTICLES: Wajib pakai kata: "sih", "dong", "deh", "kan", "banget", "malah", "kok", "sumpah".
        4. EMOTIONAL OPENERS: Start with "Jujur...", "Sumpah...", "Gak nyangka...", "Capek banget...", "Asli...".
      `;
  } else {
      langInstruction = `LANGUAGE: Native language of ${country}. Conversational, Engaging.`;
  }
  
  const prompt = `
    ROLE: World-Class Social Media Copywriter (Instagram/TikTok/Facebook).
    TASK: Write a Long-Form Social Media Caption (Micro-Blog Style).
    
    TARGET COUNTRY: ${country}.
    ${langInstruction}
    
    STRUCTURE (The 8-Section System adapted for Social):
    1. HOOK: Start with the Hook: "${hook}".
    2. STORY: Dive immediately into the story: "${story.title}". (${story.narrative}). Keep it relatable.
    3. THE STRUGGLE: Why have they failed before? (Agitate pain).
    4. THE EPIPHANY (UMP): Reveal the "Real Enemy" (UMP: ${mechanism.ump}). It wasn't their fault.
    5. THE SOLUTION (UMS): Introduce the New Opportunity (${bigIdea.headline}).
    6. THE PRODUCT: Introduce ${project.productName} naturally as the solution vehicle (${mechanism.ums}).
    7. THE TRANSFORMATION: Describe the "After" state.
    8. CTA: ${project.offer}. Ask for a comment or click.
    
    TONE: ${project.brandVoice}. Personal, authentic, like a friend sharing a discovery.
    FORMAT: Plain text ONLY. NO Markdown (No **bold**, no # H1). Use Line Breaks for readability. Use Emojis 🚀 naturally throughout.
    
    Do NOT include section headers (like "Section 1: Hook"). Just write the post.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return {
    data: response.text || "Generation failed.",
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
}

export const checkAdCompliance = async (adCopy: AdCopy): Promise<string> => {
  const model = "gemini-2.5-flash";
  const response = await ai.models.generateContent({
    model,
    contents: `Check this Ad Copy for policy violations. If safe, return "SAFE".\nHeadline: ${adCopy.headline}\nText: ${adCopy.primaryText}`,
  });
  return response.text || "SAFE";
};
