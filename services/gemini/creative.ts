
import { Type } from "@google/genai";
import { ProjectContext, CreativeFormat, AdCopy, CreativeConcept, GenResult, StoryOption, BigIdeaOption, MechanismOption, MarketAwareness } from "../../types";
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
    
    PRODUCT DETAILS:
    ${project.productDescription}
    
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
    Product Name: ${project.productName}
    Product Description (WHAT IT IS): ${project.productDescription}
    Winning Insight: ${angle}
    Format: ${format}
    Context: ${project.targetCountry}
    ${awarenessInstruction}
    
    **CRITICAL FOR FORMAT '${format}':**
    *   If 'Long Text' or 'Story': You MUST describe a vertical, candid, authentic shot (e.g., Selfie in car, Mirror selfie, Handheld). NO STOCK PHOTOS. The image description must explicitly mention WHERE the text overlay will go (e.g., "White text box above head").
    *   If 'Ugly Visual' or 'Pattern Interrupt': Describe a chaotic, low-fidelity scene.
    
    **TASK:**
    Create a concept that VIOLATES the expectations of the feed.

    **VISUAL INSTRUCTION (MICRO-MOMENTS):**
    If the hook is about a habit, ritual, or anxiety, describe the SPECIFIC MICRO-MOMENT.
    Bad: "A sad person."
    Good: "A POV shot of looking down at a bathroom scale seeing the number, toes curled in anxiety."
    Good: "Checking banking app at 3AM with one eye open."
    
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
  concept: CreativeConcept,
  format?: CreativeFormat,
  isHVCOFlow: boolean = false,
  mechanism?: MechanismOption
): Promise<GenResult<AdCopy>> => {
  const model = "gemini-2.5-flash";
  const country = project.targetCountry || "USA";
  const isIndo = country.toLowerCase().includes("indonesia");

  // 1. INFORMATION GAP LOGIC (Stage-Based Copy)
  const isUnaware = project.marketAwareness === MarketAwareness.UNAWARE || project.marketAwareness === MarketAwareness.PROBLEM_AWARE;
  let productContext = "";

  if (isUnaware) {
      // HIDE PRODUCT for Unaware/Problem Aware
      productContext = `
      CONTEXT: The user is in PAIN but does NOT know the solution exists.
      FORBIDDEN: Do NOT mention "${project.productName}" in the Hook or Body. Do NOT mention the Offer yet.
      FOCUS: Describe the symptoms, the frustration of failed attempts, and the "I realized" moment.
      GOAL: Get them to say "That's exactly how I feel" (Identification).
      `;
  } else {
      // SHOW PRODUCT for Solution/Product Aware
      productContext = `
      PRODUCT: ${project.productName}
      DETAILS: ${project.productDescription}
      OFFER: ${project.offer}
      GOAL: Persuade them to buy now using scarcity and benefits.
      `;
  }

  // 2. STRUCTURE LOGIC (Unaware Story)
  let structureInstruction = "";
  if (isUnaware) {
      structureInstruction = `
      STRUCTURE (Strictly Follow):
      1. THE HOOK: A raw, specific admission or observation (e.g. "I almost fired my best employee yesterday").
      2. IDENTIFICATION: Describe the visceral feeling of the problem. Use sensory details.
      3. AMPLIFICATION: List 2-3 things they tried that FAILED.
      4. THE TURN: A subtle hint that a "New Mechanism" exists (without naming the product yet).
      5. CTA: "${project.offer}" (Only at the very end).
      `;
  }

  // 3. MECHANISM INTEGRATION
  let mechanismInstruction = "";
  if (mechanism) {
      mechanismInstruction = `
      CORE ARGUMENT (THE LOGIC):
      You must explain the failure of other solutions using this UMP (Unique Mechanism of Problem): "${mechanism.ump}".
      Then, introduce the solution using this UMS (Unique Mechanism of Solution): "${mechanism.ums}".
      Use the pseudo-scientific name: "${mechanism.scientificPseudo}".
      `;
  }

  // DETECT LEAD MAGNET / HVCO
  const isHVCO = isHVCOFlow || format === CreativeFormat.LEAD_MAGNET_3D || concept.visualScene.includes("Book") || concept.visualScene.includes("Report");

  let specialInstruction = "";
  let toneInstruction = "";

  if (isHVCO) {
      specialInstruction = `
        MODE: SELLING THE CLICK (Lead Magnet).
        DO NOT sell the product directly. Sell the FREE INFO (Guide/PDF/Video).
        
        CRITICAL: Use "FASCINATIONS" Bullet Points.
        (e.g., "• The 1 food you must avoid...")
        (e.g., "• Why your doctor is wrong about X...")
        (e.g., "• Page 7: The 3-minute trick that changes everything.")
        
        Create 3-5 Curiosity-Dripping Bullets based on the Hook: "${concept.hookComponent || 'Download Now'}".
      `;
      
      // 4. HVCO ANTI-MARKETING TONE
      toneInstruction = `
        TONE: Whistleblower / Insider / "The thing they don't want you to know".
        Do NOT sound like a marketer. Sound like a friend warning another friend.
        Use phrases like:
        - "Stop doing X immediately."
        - "The lie we've been told about Y."
        - "I found the missing document."
      `;
  } else {
      // STANDARD TONE CALIBRATION
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
  }

  // SYSTEM: HEADLINE CONTEXT LIBRARY (THE STATIC AD RULES)
  const prompt = `
    # Role: Senior Direct Response Copywriter (Static Ad Specialist)

    **AAZAR SHAD'S "SKIM-ABILITY" RULE:**
    People DO NOT read ads. They skim them.
    1. NO Wall of Text. Paragraphs must be 1-2 lines max.
    2. Use Bullet Points (•) or Emojis (✅) to break up benefits.
    3. The first sentence must be a "Velcro Hook" (Short, punchy).

    **MANDATORY INSTRUCTIONS:**
    ${toneInstruction}
    TARGET COUNTRY: ${country}.
    ${specialInstruction}
    ${structureInstruction}

    **THE HEADLINE CONTEXT LIBRARY (RULES):**
    1.  **Assume No One Knows You:** Treat the audience as COLD. Do not be vague.
    2.  **Clear > Clever:** Clarity drives conversions.
    3.  **The "So That" Test:** Sell the AFTER state.
    4.  **Call Out the Audience/Pain:** Flag down the user immediately.
    5.  **Visual Hierarchy:** The headline MUST match the image scene described below.

    **STRATEGY CONTEXT:**
    ${productContext}
    Target: ${persona.name}
    
    ${mechanismInstruction}
    
    **CONGRUENCE CONTEXT (IMAGE SCENE):**
    Visual Scene: "${concept.visualScene}"
    Rationale: "${concept.congruenceRationale}"
    
    **TASK:**
    Write the ad copy applying the rules above.

    **OUTPUT FORMATTING:**
    - primaryText: Must be visually spaced out. Use line breaks.
    - headline: High contrast. MUST be congruent with the Visual Scene.
    - cta: Clear instruction.
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
