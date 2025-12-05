
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProjectContext, CreativeFormat, AdCopy, CreativeConcept, GenResult, StoryOption, BigIdeaOption, MechanismOption } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILS ---

function extractJSON<T>(text: string): T {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parse Error", e, text);
    return {} as T;
  }
}

// --- STORY LEAD MEGAPROMPT FUNCTIONS (NEW) ---

export const generateStoryResearch = async (project: ProjectContext): Promise<GenResult<StoryOption[]>> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    ROLE: Data Miner / Reddit Researcher
    
    TASK: Find/Generate 3 distinct "Unaware" Stories related to: ${project.productName}.
    These stories should sound like highly emotional, raw Reddit threads or Forum posts (e.g., r/TrueOffMyChest, r/Relationships).
    
    CRITICAL RULE:
    - The stories must be about the PROBLEM/SYMPTOM. 
    - Do NOT mention the product or solution yet. 
    - Focus on the "Bleeding Neck" pain.
    - Context: ${project.targetCountry || "General"}.
    
    INPUT DATA:
    Target Audience: ${project.targetAudience}
    Deep Pain: ${project.productDescription}

    OUTPUT JSON:
    Return 3 stories.
    - title: Catchy Reddit-style title.
    - narrative: A 2-3 sentence summary of the story/struggle.
    - emotionalTheme: The core emotion (e.g., "Shame", "Anger", "Exhaustion").
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
            title: { type: Type.STRING },
            narrative: { type: Type.STRING },
            emotionalTheme: { type: Type.STRING }
          },
          required: ["title", "narrative", "emotionalTheme"]
        }
      }
    }
  });

  const stories = extractJSON<any[]>(response.text || "[]");
  return {
    data: stories.map((s, i) => ({ ...s, id: `story-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

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

export const generateSalesLetter = async (
    project: ProjectContext, 
    story: StoryOption, 
    bigIdea: BigIdeaOption, 
    mechanism: MechanismOption,
    hook: string
): Promise<GenResult<string>> => {
  const model = "gemini-2.5-flash"; 
  const isIndo = project.targetCountry?.toLowerCase().includes("indonesia");
  
  const prompt = `
    ROLE: World-Class Social Media Copywriter (Instagram/TikTok/Facebook).
    TASK: Write a Long-Form Social Media Caption (Micro-Blog Style).
    
    LANGUAGE: ${isIndo ? "Bahasa Indonesia (Conversational, Engaging, No Formal Language)" : "English (Conversational, Engaging)"}
    
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


const VISUAL_STYLES = [
  "Shot on 35mm film, Fujifilm Pro 400H, grainy texture, nostalgic",
  "High-end studio photography, softbox lighting, sharp focus, 8k resolution",
  "Gen-Z aesthetic, flash photography, direct flash, high contrast, candid",
  "Cinematic lighting, golden hour, shallow depth of field, bokeh background",
  "Clean minimalist product photography, bright airy lighting, pastel tones"
];

const getRandomStyle = () => VISUAL_STYLES[Math.floor(Math.random() * VISUAL_STYLES.length)];

// --- ANALYSIS FUNCTIONS ---

export const analyzeLandingPageContext = async (markdown: string): Promise<ProjectContext> => {
  const model = "gemini-2.5-flash";
  
  // SYSTEM: Gather Data (Step 1 of the Tweet)
  const response = await ai.models.generateContent({
    model,
    contents: `You are a Data Analyst for a Direct Response Agency. 
    Analyze the following raw data (Landing Page Content) to extract the foundational truths.
    
    RAW DATA:
    ${markdown.substring(0, 30000)}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          productDescription: { type: Type.STRING, description: "A punchy, benefit-driven 1-sentence value prop." },
          targetAudience: { type: Type.STRING, description: "Specific demographics and psychographics." },
          targetCountry: { type: Type.STRING },
          brandVoice: { type: Type.STRING },
          offer: { type: Type.STRING, description: "The primary hook or deal found on the page." }
        },
        required: ["productName", "productDescription", "targetAudience"]
      }
    }
  });

  const data = extractJSON<Partial<ProjectContext>>(response.text || "{}");
  
  return {
    productName: data.productName || "Unknown Product",
    productDescription: data.productDescription || "",
    targetAudience: data.targetAudience || "General Audience",
    targetCountry: data.targetCountry || "USA",
    brandVoice: data.brandVoice || "Professional",
    offer: data.offer || "Shop Now",
    landingPageUrl: "" 
  } as ProjectContext;
};

export const analyzeImageContext = async (base64Image: string): Promise<ProjectContext> => {
  const base64Data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Data } },
        { text: "Analyze this product image. Extract the Product Name (if visible, otherwise guess), a compelling Description, and the likely Target Audience." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          productDescription: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          targetCountry: { type: Type.STRING }
        },
        required: ["productName", "productDescription"]
      }
    }
  });

  const data = extractJSON<Partial<ProjectContext>>(response.text || "{}");

  return {
    productName: data.productName || "Analyzed Product",
    productDescription: data.productDescription || "A revolutionary product.",
    targetAudience: data.targetAudience || "General Audience",
    targetCountry: "USA", 
    brandVoice: "Visual & Aesthetic",
    offer: "Check it out"
  } as ProjectContext;
};

// --- GENERATION FUNCTIONS ---

export const generatePersonas = async (project: ProjectContext): Promise<GenResult<any[]>> => {
  const model = "gemini-2.5-flash";
  
  // SYSTEM: Identity Mapping (Step 3: "Tag with Psychology" - Identity)
  const prompt = `
    You are a Consumer Psychologist specializing in ${project.targetCountry || "the target market"}.
    
    PRODUCT CONTEXT:
    Product: ${project.productName}
    Details: ${project.productDescription}
    
    TASK:
    Define 3 distinct "Avatars" based on their IDENTITY and DEEP PSYCHOLOGICAL NEEDS.
    Do not just list demographics. List who they *are* vs who they *want to be* (The Gap).

    We are looking for:
    1. The Skeptic / Logic Buyer (Identity: "I am smart, I research, I don't get fooled.")
    2. The Status / Aspirer (Identity: "I want to be admired/successful/beautiful.")
    3. The Anxious / Urgent Solver (Identity: "I need safety/certainty/speed.")

    *Cultural nuance mandatory for ${project.targetCountry}. If Indonesia, mention specific local behaviors (e.g., 'Kaum Mendang-Mending', 'Social Climber').*
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
            name: { type: Type.STRING },
            profile: { type: Type.STRING, description: "Demographics + Identity Statement" },
            motivation: { type: Type.STRING, description: "The 'Gap' between current self and desired self." },
            deepFear: { type: Type.STRING, description: "What are they afraid of losing?" },
          },
          required: ["name", "profile", "motivation"]
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

export const generateCreativeConcept = async (
  project: ProjectContext, 
  personaName: string, 
  angle: string, 
  format: CreativeFormat
): Promise<GenResult<CreativeConcept>> => {
  const model = "gemini-2.5-flash";

  // SYSTEM: Congruency Engine (The Jeans Rule)
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

  // SYSTEM: Ship Fast (Step 5)
  const isIndo = project.targetCountry?.toLowerCase().includes("indonesia");
  const languageInstruction = isIndo
    ? "Write in Bahasa Indonesia. Use 'Bahasa Marketing' (mix of persuasive & conversational). Use local power words (e.g., 'Slot Terbatas', 'Best Seller', 'Gak Nyesel')."
    : "Write in English (or native language). Use persuasive Direct Response copy.";

  // SYSTEM: HEADLINE CONTEXT LIBRARY (THE STATIC AD RULES)
  const prompt = `
    # Role: Senior Direct Response Copywriter (Static Ad Specialist)

    **MANDATORY INSTRUCTION:**
    ${languageInstruction}

    **THE HEADLINE CONTEXT LIBRARY (RULES):**
    1.  **Assume No One Knows You:** Treat the audience as COLD. Do not be vague. "I feel new" (BAD) vs "Bye-Bye Bloating" (GOOD).
    2.  **Clear > Clever:** Clarity drives conversions. No puns. No jargon. If they have to think, you lose.
    3.  **The "So That" Test (Transformation > Feature):** 
        *   Feature: "1000mAh Battery" (Boring).
        *   Transformation: "Listen to music for 48 hours straight" (Winner).
        *   *Rule:* Sell the AFTER state.
    4.  **Call Out the Audience/Pain:** Flag down the user immediately.
        *   "For Busy Moms..."
        *   "Knee Pain keeping you up?"
        *   "The last backpack a Digital Nomad will need."
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

export const checkAdCompliance = async (adCopy: AdCopy): Promise<string> => {
  const model = "gemini-2.5-flash";
  const response = await ai.models.generateContent({
    model,
    contents: `Check this Ad Copy for policy violations. If safe, return "SAFE".\nHeadline: ${adCopy.headline}\nText: ${adCopy.primaryText}`,
  });
  return response.text || "SAFE";
};

// --- IMAGE GENERATION (NANO BANANA) ---

export const generateCreativeImage = async (
  project: ProjectContext,
  personaName: string,
  angle: string,
  format: CreativeFormat,
  visualScene: string,
  visualStyle: string,
  technicalPrompt: string,
  aspectRatio: string = "1:1"
): Promise<GenResult<string | null>> => {
  
  const model = "gemini-2.5-flash-image";

  // 1. CULTURAL & SERVICE CONTEXT INJECTION
  const isIndo = project.targetCountry?.toLowerCase().includes("indonesia");
  const lowerDesc = project.productDescription.toLowerCase();
  
  // Is this a Service Business? (Used for fallback logic only)
  const isService = lowerDesc.includes("studio") || lowerDesc.includes("service") || lowerDesc.includes("jasa") || lowerDesc.includes("photography") || lowerDesc.includes("clinic");
  
  let culturePrompt = "";
  if (isIndo) {
     culturePrompt = " Indonesian aesthetic, Asian features, localized environment.";
     
     // Specific Case: Graduation/Wisuda
     if (lowerDesc.includes("graduation") || lowerDesc.includes("wisuda")) {
         culturePrompt += " Young Indonesian university student wearing a black graduation toga with university sash/selempang (Indonesian style), holding a tube or bouquet. Authentic Indonesian look (hijab optional but common).";
     }
  }

  // 2. PHOTOGRAPHY ENHANCERS - SPLIT BETWEEN PRO AND UGC
  const professionalEnhancers = "Photorealistic, 8k resolution, highly detailed, shot on 35mm lens, depth of field, natural lighting, sharp focus.";
  const ugcEnhancers = "Shot on iPhone 15, low fidelity, raw photo, slightly grainy, authentic amateur photography, harsh flash, social media compression, no bokeh, everything in focus (deep depth of field), realistic skin texture, slightly messy background.";

  // 3. STRICT FORMAT ENGINEERING
  let finalPrompt = "";
  let appliedEnhancer = professionalEnhancers; // Default to pro
  
  // CONGRUENCY INJECTION
  const contextInjection = `(Context: The image must match this headline: "${angle}").`;

  // === NATIVE INSTAGRAM & STORY ENGINE ===
  const isNativeStory = 
    format === CreativeFormat.STORY_QNA || 
    format === CreativeFormat.LONG_TEXT || 
    format === CreativeFormat.UGC_MIRROR ||
    format === CreativeFormat.PHONE_NOTES ||
    format === CreativeFormat.TWITTER_REPOST ||
    format === CreativeFormat.SOCIAL_COMMENT_STACK ||
    format === CreativeFormat.HANDHELD_TWEET ||
    format === CreativeFormat.STORY_POLL;

  if (isNativeStory) {
      appliedEnhancer = ugcEnhancers; // SWITCH TO UGC MODE

      // 1. Determine "Candid Environment" (Car, Window, Mirror)
      const randomEnv = Math.random();
      let environment = "inside a modern car during daytime, sunlight hitting face (car selfie vibe)";
      if (randomEnv > 0.6) environment = "leaning against a window with natural light, contemplative mood";
      if (randomEnv > 0.85) environment = "mirror selfie in a clean, modern aesthetic room";

      // 2. Determine "UI Overlay Style" - MUST BE SPECIFIC
      let uiOverlay = "";
      if (format === CreativeFormat.STORY_QNA) {
          uiOverlay = `Overlay: A standard Instagram 'Question Box' sticker (white rectangle with rounded corners) floating near the head. The text in the box asks: "${angle}?". There is a typed response below it.`;
      } else if (format === CreativeFormat.LONG_TEXT || format === CreativeFormat.STORY_POLL) {
          uiOverlay = `Overlay: A large, massive block of text (long copy) covering the center of the image. It looks like a long Instagram story caption. The text is white with a translucent black background for readability. The text is dense and tells a story about "${angle}".`;
      } else if (format === CreativeFormat.HANDHELD_TWEET || format === CreativeFormat.TWITTER_REPOST) {
           uiOverlay = `Overlay: A social media post screenshot (Twitter/X style) superimposed on the image. The text on the post is sharp and reads: "${angle}".`;
      } else if (format === CreativeFormat.PHONE_NOTES) {
           uiOverlay = `A full screen screenshot of the Apple Notes App. Title: "${angle}". Below is a typed list related to ${project.productName}.`;
           environment = ""; // Notes app takes full screen
      } else if (format === CreativeFormat.UGC_MIRROR) {
          uiOverlay = `Overlay: Several 'Instagram Text Bubbles' floating around the subject. Text in bubbles: "${angle}".`;
      }

      // 3. Construct the "Native" Prompt
      if (environment) {
          finalPrompt = `A vertical, authentic UGC photo of a person (Indonesian look if applicable) ${environment}. ${uiOverlay} ${appliedEnhancer} ${culturePrompt}. Make it look like a real Instagram Story, NOT a professional ad.`;
      } else {
          finalPrompt = `${uiOverlay} ${appliedEnhancer}. Photorealistic UI render.`;
      }
  }

  // === OTHER DIRECT RESPONSE UI FORMATS ===
  else if (format === CreativeFormat.STICKY_NOTE_REALISM) {
    finalPrompt = `A real yellow post-it sticky note stuck on a surface. Handwritten black marker text on the note says: "${angle}". Sharp focus on the text, realistic paper texture, soft shadows. ${appliedEnhancer}`;
  }
  else if (format === CreativeFormat.BENEFIT_POINTERS) {
    // Force product/subject visualization with lines
    finalPrompt = `A high-quality product photography shot of ${project.productName} (or the main subject of the service). Clean background. There are sleek, modern graphic lines pointing to 3 key features of the subject. The style is "Anatomy Breakdown". ${appliedEnhancer} ${culturePrompt}. (Note: The pointers are the main visual hook).`;
  }
  else if (format === CreativeFormat.US_VS_THEM) {
    finalPrompt = `A split screen comparison image. Left side (Them): Cloudy, sad, messy, labeled "Them". Right side (Us): Bright, happy, organized, labeled "Us". The subject is related to: ${project.productName}. ${appliedEnhancer} ${culturePrompt}.`;
  }
  // === CAROUSEL FORMATS (Relies on specific technicalPrompt passed from generateCarouselSlides) ===
  else if (
      format === CreativeFormat.CAROUSEL_REAL_STORY || 
      format === CreativeFormat.CAROUSEL_EDUCATIONAL || 
      format === CreativeFormat.CAROUSEL_TESTIMONIAL
  ) {
      // Trust the technicalPrompt fully for Carousels as it contains Slide-specific info
      // Check if the carousel implies UGC or Pro
      if (format === CreativeFormat.CAROUSEL_REAL_STORY) {
          appliedEnhancer = ugcEnhancers;
      }
      finalPrompt = `${technicalPrompt}. ${appliedEnhancer} ${culturePrompt}`;
  }
  // === FALLBACK: SERVICE BUSINESS LOGIC ===
  // Only apply "Service Logic" if it's NOT one of the specific formats above
  else if (isService) {
      // For services, we focus on the RESULT or the EXPERIENCE, not a "Product Box"
      finalPrompt = `${contextInjection} ${technicalPrompt}. ${culturePrompt} ${appliedEnhancer}. (Note: This is a service, do not show a retail box. Show the person experiencing the result).`;
  }
  // === FALLBACK: STANDARD GENERIC ===
  else {
     if (technicalPrompt && technicalPrompt.length > 20) {
         finalPrompt = `${contextInjection} ${technicalPrompt}. ${appliedEnhancer} ${culturePrompt}`;
     } else {
         finalPrompt = `${contextInjection} ${visualScene}. Style: ${visualStyle || getRandomStyle()}. ${appliedEnhancer} ${culturePrompt}`;
     }
  }

  const parts: any[] = [{ text: finalPrompt }];
  
  if (project.productReferenceImage) {
      const base64Data = project.productReferenceImage.split(',')[1] || project.productReferenceImage;
      parts.unshift({
          inlineData: { mimeType: "image/png", data: base64Data }
      });
      parts.push({ text: "Use the product/subject in the provided image as the reference. Maintain brand colors and visual identity." });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { imageConfig: { aspectRatio: aspectRatio === "1:1" ? "1:1" : "9:16" } }
    });

    let imageUrl: string | null = null;
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }
    return {
      data: imageUrl,
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    };
  } catch (error) {
    console.error("Image Gen Error", error);
    return { data: null, inputTokens: 0, outputTokens: 0 };
  }
};

export const generateCarouselSlides = async (
  project: ProjectContext,
  format: CreativeFormat,
  angle: string,
  visualScene: string,
  visualStyle: string,
  technicalPrompt: string
): Promise<GenResult<string[]>> => {
    const slides: string[] = [];
    let totalInput = 0;
    let totalOutput = 0;

    // DYNAMIC STORYBOARDING FOR CAROUSELS
    // We break the single technicalPrompt into a 3-act structure
    
    for (let i = 1; i <= 3; i++) {
        let slidePrompt = "";
        
        if (format === CreativeFormat.CAROUSEL_REAL_STORY) {
             if (i === 1) slidePrompt = `Slide 1 (The Hook): A candid, slightly imperfect UGC-style photo showing the PROBLEM or PAIN POINT. The subject looks frustrated or tired. Context: ${angle}. Style: Handheld camera.`;
             if (i === 2) slidePrompt = `Slide 2 (The Turn): The subject discovers ${project.productName}. A close up shot of the product/service in use. Natural lighting.`;
             if (i === 3) slidePrompt = `Slide 3 (The Result): The subject looks relieved and happy. A glowing transformation result. Text overlay implied: "Saved my life".`;
        } 
        else if (format === CreativeFormat.CAROUSEL_EDUCATIONAL) {
             if (i === 1) slidePrompt = `Slide 1 (Title Card): Minimalist background with plenty of negative space for text. Visual icon representing the topic: ${angle}.`;
             if (i === 2) slidePrompt = `Slide 2 (The Method): A diagram or clear photo demonstrating the 'How To' aspect of the solution.`;
             if (i === 3) slidePrompt = `Slide 3 (Summary): A checklist visual or a final result shot showing success.`;
        }
        else {
            // Default Carousel Structure
            if (i === 1) slidePrompt = `${technicalPrompt}. Slide 1: The Hook/Problem. High tension visual.`;
            if (i === 2) slidePrompt = `${technicalPrompt}. Slide 2: The Solution/Process. Detailed macro shot.`;
            if (i === 3) slidePrompt = `${technicalPrompt}. Slide 3: The Result/CTA. Happy resolution.`;
        }

        const result = await generateCreativeImage(
            project, "User", angle, format, visualScene, visualStyle, slidePrompt, "1:1"
        );
        if (result.data) slides.push(result.data);
        totalInput += result.inputTokens;
        totalOutput += result.outputTokens;
    }

    return { data: slides, inputTokens: totalInput, outputTokens: totalOutput };
};

// --- AUDIO GENERATION ---

export const generateAdScript = async (project: ProjectContext, personaName: string, angle: string): Promise<string> => {
    const model = "gemini-2.5-flash";
    const lang = project.targetCountry?.toLowerCase().includes("indonesia") ? "Bahasa Indonesia (Colloquial/Gaul)" : "English";

    const response = await ai.models.generateContent({
        model,
        contents: `Write a 15-second TikTok/Reels UGC script for: ${project.productName}. Language: ${lang}. Angle: ${angle}. Keep it under 40 words. Hook the viewer instantly.`
    });
    return response.text || "Script generation failed.";
};

export const generateVoiceover = async (script: string, personaName: string): Promise<string | null> => {
    const spokenText = script.replace(/\[.*?\]/g, '').trim();
    let voiceName = 'Zephyr'; 
    if (personaName.toLowerCase().includes('skeptic') || personaName.toLowerCase().includes('man')) voiceName = 'Fenrir';
    if (personaName.toLowerCase().includes('status') || personaName.toLowerCase().includes('woman')) voiceName = 'Kore';

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: spokenText }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
            }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
        console.error("TTS Error", e);
        return null;
    }
};
