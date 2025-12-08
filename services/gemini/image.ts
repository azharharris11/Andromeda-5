import { ProjectContext, CreativeFormat, GenResult, MarketAwareness } from "../../types";
import { ai } from "./client";

const SAFETY_GUIDELINES = `
  CRITICAL AD POLICY COMPLIANCE:
  1. NO Nudity or Sexual content.
  2. NO Medical Gore or overly graphic body fluids.
  3. NO "Before/After" split screens that show unrealistic body transformations.
  4. NO Glitchy text unless specified.
  5. If humans are shown, they must look realistic with normal anatomy.
`;

const VISUAL_STYLES = [
  "Shot on 35mm film, Fujifilm Pro 400H, grainy texture, nostalgic",
  "High-end studio photography, softbox lighting, sharp focus, 8k resolution",
  "Gen-Z aesthetic, flash photography, direct flash, high contrast, candid",
  "Cinematic lighting, golden hour, shallow depth of field, bokeh background",
  "Clean minimalist product photography, bright airy lighting, pastel tones"
];

const getRandomStyle = () => VISUAL_STYLES[Math.floor(Math.random() * VISUAL_STYLES.length)];

export const generateCreativeImage = async (
  project: ProjectContext,
  personaName: string,
  angle: string,
  format: CreativeFormat,
  visualScene: string,
  visualStyle: string,
  technicalPrompt: string,
  aspectRatio: string = "1:1",
  referenceImageBase64?: string
): Promise<GenResult<string | null>> => {
  
  const model = "gemini-2.5-flash-image";
  const country = project.targetCountry || "USA";
  const lowerDesc = project.productDescription.toLowerCase();
  
  const isService = lowerDesc.includes("studio") || lowerDesc.includes("service") || lowerDesc.includes("jasa") || lowerDesc.includes("photography") || lowerDesc.includes("clinic");
  
  // DYNAMIC CULTURAL INJECTION
  const culturePrompt = `
    Target Country: ${country}.
    Aesthetics: Adapt visual style, models, and environment to ${country}. 
    If SE Asia -> Use Asian models, scooters, tropical greenery, warmer lighting.
  `;

  // === LOGIC UPGRADE: SENTIMENT AWARENESS ---
  const isNegativeAngle = /stop|avoid|warning|danger|don't|mistake|worst|kill|never/i.test(angle);
  let moodPrompt = "Lighting: Natural, inviting, high energy. Emotion: Positive, Solution-oriented.";
  
  if (isNegativeAngle) {
      moodPrompt = "Lighting: High contrast, dramatic shadows, moody atmosphere, perhaps a subtle red tint. Emotion: Serious, Urgent, Warning vibe. Subject should NOT be smiling. Show concern or frustration.";
  }

  // === LOGIC UPGRADE: LEAD MAGNET VISUAL COHERENCE ---
  const isLeadMagnet = /guide|checklist|report|pdf|cheat sheet|blueprint|system|protocol|roadmap|masterclass|training|secrets|list|whitepaper/i.test(angle);
  let leadMagnetInstruction = "";
  if (isLeadMagnet && format !== CreativeFormat.LEAD_MAGNET_3D) {
      leadMagnetInstruction = `IMPORTANT: The subject is holding a printed document, binder, or iPad displaying a report titled "${angle}". Do NOT show a retail product bottle. Show the information asset.`;
  }

  // === IMAGE ENHANCER TIERS ===
  const professionalEnhancers = "Photorealistic, 8k resolution, highly detailed, shot on 35mm lens, depth of field, natural lighting, sharp focus.";
  
  const ugcEnhancers = "Shot on iPhone 15, raw photo, realistic skin texture, authentic amateur photography, slightly messy background, no bokeh, everything in focus (deep depth of field).";

  // NEW: TRASH TIER FOR "UGLY ADS" - SABRI SUBY "NATIVE CONTENT" UPGRADE
  // Updated with explicit exclusions/negative prompting simulation
  const trashTierEnhancers = "Amateur phone photo. EXCLUDE: Professional lighting, bokeh, symmetry, perfect skin, studio setup, 4k, HDR, smooth textures. MAKE IT LOOK LIKE A MISTAKE. Low fidelity, authentic UGC. Shot on iPhone. Slight motion blur allowed. Bad lighting (overhead fluorescent or direct flash). Looks like a photo sent to a group chat. NO professional composition. The goal is 'Pattern Interrupt' - it must NOT look like an ad.";

  let finalPrompt = "";
  let appliedEnhancer = professionalEnhancers; 
  
  // === LOGIC UPGRADE: STAGE-BASED VISUAL EVOLUTION ===
  let subjectFocus = "";

  switch (project.marketAwareness) {
    case MarketAwareness.UNAWARE:
        // Fokus: "Ritual" atau "Gejala"
        subjectFocus = `SUBJECT: A specific, raw life moment showing the PAIN/SYMPTOM. NO PRODUCT BRANDING. Example: A person rubbing their temple in a dark room, or staring at a ceiling at 3AM. Focus on the 'Ritual' of the problem.`;
        break;
    case MarketAwareness.PROBLEM_AWARE:
        // Fokus: "Solusi Gagal"
        subjectFocus = `SUBJECT: The "Graveyard of Failed Attempts". Show the clutter of old solutions that didn't work (e.g. empty bottles, unused equipment, pile of bills). Frustrated mood. NO NEW PRODUCT YET.`;
        break;
    case MarketAwareness.SOLUTION_AWARE:
        // Fokus: "Mekanisme Baru"
        subjectFocus = `SUBJECT: A comparative visual or "Mechanism" visualization. Old Way vs New Way. Side-by-side comparison or split screen context. Product can be present as the 'New Way'.`;
        break;
    case MarketAwareness.PRODUCT_AWARE:
    case MarketAwareness.MOST_AWARE:
        // Fokus: "Offer & Produk"
        subjectFocus = `SUBJECT: The Product Hero Shot. Highlighting the OFFER (e.g. "Buy 2 Get 1"). Show the full bundle stack clearly. Highlighting value and scarcity.`;
        break;
    default:
        // Fallback
        subjectFocus = `SUBJECT: High context visual related to ${angle}.`;
  }

  // 1. UGLY / PATTERN INTERRUPT LOGIC
  const isUglyFormat = 
    format === CreativeFormat.UGLY_VISUAL ||
    format === CreativeFormat.MS_PAINT ||
    format === CreativeFormat.REDDIT_THREAD ||
    format === CreativeFormat.MEME;
    
  // 2. NATIVE STORY LOGIC
  const isNativeStory = 
    format === CreativeFormat.STORY_QNA || 
    format === CreativeFormat.LONG_TEXT || 
    format === CreativeFormat.UGC_MIRROR ||
    format === CreativeFormat.PHONE_NOTES ||
    format === CreativeFormat.TWITTER_REPOST ||
    format === CreativeFormat.SOCIAL_COMMENT_STACK ||
    format === CreativeFormat.HANDHELD_TWEET ||
    format === CreativeFormat.STORY_POLL ||
    format === CreativeFormat.EDUCATIONAL_RANT;

  // === METAPHOR MODE ===
  // Cek sederhana untuk kata kunci metafora
  const isMetaphor = /battery|engine|fuel|prison|trap|key|lock|magnet|chain|anchor|leaking|drain|shield|armor|bridge|monster|shadow|cliff|mountain|broken|repair/i.test(angle);
  let metaphorInstruction = "";
  
  if (isMetaphor && !isUglyFormat && !isNativeStory && format !== CreativeFormat.LEAD_MAGNET_3D) {
      metaphorInstruction = ` 
        STYLE: Surrealist/Editorial Illustration or High-Concept Photography. 
        Depict the concept of "${angle}" as a VISUAL METAPHOR. 
        Do not show a literal human unless interacting with the metaphor. Show the object/symbol representing the struggle.
      `;
  }

  // === LOGIC BRANCHING ===

  if (isUglyFormat) {
      appliedEnhancer = trashTierEnhancers;
      
      if (format === CreativeFormat.MS_PAINT) {
          finalPrompt = `A crude, badly drawn MS Paint illustration related to ${project.productName}. Stick figures, comic sans text, bright primary colors, looks like a child or amateur drew it. Authentically bad internet meme style. ${SAFETY_GUIDELINES}`;
      } else if (format === CreativeFormat.UGLY_VISUAL) {
          finalPrompt = `A very low quality, cursed image vibe. ${subjectFocus}. ${technicalPrompt || visualScene}. ${trashTierEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}.`;
      } else {
          finalPrompt = `${subjectFocus}. ${technicalPrompt}. ${trashTierEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
      }
  }
  else if (isNativeStory) {
      appliedEnhancer = ugcEnhancers; 

      if (format === CreativeFormat.EDUCATIONAL_RANT) {
          // Green Screen Logic
          finalPrompt = `A person engaging with the camera, 'Green Screen' effect style. Background is a screenshot of a news article or a graph related to ${angle}. The person looks passionate/angry (ranting). Native TikTok/Reels aesthetic. UI overlay: "Stop doing this!". ${ugcEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
      } else {
        // Updated Story Logic: STRICT adherence to visualScene action
        // 1. Determine "Candid Environment"
        const randomEnv = Math.random();
        let environment = "inside a modern car during daytime, sunlight hitting face (car selfie vibe)";
        if (randomEnv > 0.6) environment = "leaning against a window with natural light, contemplative mood";
        if (randomEnv > 0.85) environment = "mirror selfie in a clean, modern aesthetic room";

        // 2. Determine "UI Overlay Style"
        let uiOverlay = "";
        if (format === CreativeFormat.STORY_QNA) {
            uiOverlay = `Overlay: A standard Instagram 'Question Box' sticker (white rectangle with rounded corners) floating near the head. The text in the box asks: "${angle}?". There is a typed response below it.`;
        } else if (format === CreativeFormat.LONG_TEXT || format === CreativeFormat.STORY_POLL) {
            uiOverlay = `Overlay: A large, massive block of text (long copy) covering the center of the image. It looks like a long Instagram story caption. The text is white with a translucent black background for readability.`;
        } else if (format === CreativeFormat.HANDHELD_TWEET || format === CreativeFormat.TWITTER_REPOST) {
            uiOverlay = `Overlay: A social media post screenshot (Twitter/X style) superimposed on the image. The text on the post is sharp and reads: "${angle}".`;
        } else if (format === CreativeFormat.PHONE_NOTES) {
            uiOverlay = `A full screen screenshot of the Apple Notes App. Title: "${angle}". Below is a typed list related to ${project.productName}.`;
            environment = ""; 
        } else if (format === CreativeFormat.UGC_MIRROR) {
            uiOverlay = `Overlay: Several 'Instagram Text Bubbles' floating around the subject. Text in bubbles: "${angle}".`;
        }

        if (environment) {
            // Enhanced "Candid Realism" Prompt
            finalPrompt = `
              A brutally authentic, amateur photo taken from a first-person perspective (POV) or candid angle.
              SCENE ACTION (Strictly follow this): ${visualScene} (e.g., looking at a pile of bills, staring in a mirror touching face, holding a broken object).
              Environment: Messy, real-life, unpolished background (e.g., messy bedroom, car dashboard, kitchen counter with clutter).
              Lighting: Bad overhead lighting or harsh flash (Direct Flash Photography).
              Quality: Slightly grainy, iPhone photo quality.
              ${uiOverlay} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}. Make it look like a real Instagram Story.
            `;
        } else {
            finalPrompt = `${uiOverlay} ${appliedEnhancer} ${SAFETY_GUIDELINES}. Photorealistic UI render.`;
        }
      }
  }
  // === AAZAR SHAD'S WINNING FORMATS ===
  else if (format === CreativeFormat.VENN_DIAGRAM) {
      finalPrompt = `A simple, minimalist Venn Diagram graphic on a solid, clean background. Left Circle Label: "Competitors" or "Others". Right Circle Label: "${project.productName}". The Intersection (Middle) contains the key benefit: "${angle}". Style: Corporate Memphis flat design or clean line art. High contrast text. The goal is to show that ONLY this product has the winning combination. ${appliedEnhancer} ${SAFETY_GUIDELINES}`;
  }
  else if (format === CreativeFormat.PRESS_FEATURE) {
      finalPrompt = `
        A realistic digital screenshot of an online news article.
        Header: A recognized GENERIC media logo (like 'Daily Health', 'TechInsider' - DO NOT use the product logo in the header).
        Headline: "${angle}".
        Image: High-quality candid photo of ${project.productName} embedded in the article body.
        Vibe: It must look like an editorial piece, NOT an advertisement. Trustworthy, "As seen in".
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  else if (format === CreativeFormat.TESTIMONIAL_HIGHLIGHT) {
      finalPrompt = `
        A close-up shot of a printed customer review or a digital review card on paper texture.
        Text: "${angle}".
        Key phrases are HIGHLIGHTED in bright neon yellow marker.
        Background: A messy desk or kitchen counter (Native/UGC vibe).
        IMPORTANT: NO Brand Logos overlay. Just the raw text and highlight.
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  else if (format === CreativeFormat.OLD_ME_VS_NEW_ME) {
      finalPrompt = `A split-screen comparison image. Left Side labeled "Old Me": Shows the 'old habit' or competitor product being thrown in a trash can, or sitting in a gloomy, messy, grey environment. Right Side labeled "New Me": Shows ${project.productName} in a bright, organized, glowing environment. Emotion: Frustration vs Relief. Text Overlay: "Them" vs "Us" or "Before" vs "After". ${appliedEnhancer} ${culturePrompt} ${SAFETY_GUIDELINES}`;
  }
  // NEW: SABRI SUBY HVCO VISUAL
  else if (format === CreativeFormat.LEAD_MAGNET_3D) {
      finalPrompt = `
        A high-quality 3D render of a physical book or spiral-bound report sitting on a modern wooden desk.
        Title on Cover: "${angle}" (Make text big and legible).
        Cover Design: Bold typography, authoritative colors (Red/Black or Deep Blue/Gold), "Best-Seller" vibe.
        Lighting: Cinematic, golden hour lighting hitting the cover.
        Background: Blurry office background implies a professional wrote this.
        No digital screens. Make it look like a physical, expensive package.
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  // NEW: MECHANISM X-RAY VISUAL
  else if (format === CreativeFormat.MECHANISM_XRAY) {
    finalPrompt = `
      A scientific or medical illustration style (clean, 3D render or cross-section diagram).
      Subject: Visualizing the "${angle}" (The internal root cause/UMP).
      Detail: Show the biological or mechanical failure point clearly inside the body/object.
      Labeling: Add a red arrow pointing to the problem area.
      Vibe: Educational, shocking discovery, "The Hidden Enemy".
      ${SAFETY_GUIDELINES}
    `;
  }

  // === OTHER FORMATS ===
  else if (format === CreativeFormat.STICKY_NOTE_REALISM) {
    finalPrompt = `A real yellow post-it sticky note stuck on a surface. Handwritten black marker text on the note says: "${angle}". Sharp focus on the text, realistic paper texture, soft shadows. ${appliedEnhancer} ${moodPrompt}`;
  }
  else if (format === CreativeFormat.BENEFIT_POINTERS) {
    finalPrompt = `A high-quality product photography shot of ${project.productName}. Clean background. Sleek, modern graphic lines pointing to 3 key features. Style: "Anatomy Breakdown". ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}.`;
  }
  else if (format === CreativeFormat.US_VS_THEM) {
    finalPrompt = `A split screen comparison image. Left side (Them): Cloudy, sad, messy, labeled "Them". Right side (Us): Bright, happy, organized, labeled "Us". Subject: ${project.productName}. ${appliedEnhancer} ${culturePrompt} ${SAFETY_GUIDELINES}.`;
  }
  else if (
      format === CreativeFormat.CAROUSEL_REAL_STORY || 
      format === CreativeFormat.CAROUSEL_EDUCATIONAL || 
      format === CreativeFormat.CAROUSEL_TESTIMONIAL
  ) {
      if (format === CreativeFormat.CAROUSEL_REAL_STORY) {
          appliedEnhancer = ugcEnhancers;
      }
      finalPrompt = `${technicalPrompt}. ${leadMagnetInstruction} ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
  }
  else if (isService) {
      finalPrompt = `${subjectFocus}. ${technicalPrompt}. ${culturePrompt} ${moodPrompt} ${appliedEnhancer} ${SAFETY_GUIDELINES}. (Note: This is a service, do not show a retail box. Show the person experiencing the result).`;
  }
  else {
      // Default
      finalPrompt = `${subjectFocus}. ${technicalPrompt}. ${culturePrompt} ${moodPrompt} ${appliedEnhancer} ${SAFETY_GUIDELINES}`;
  }

  // Append Metaphor Instruction if active
  if (metaphorInstruction) {
      finalPrompt += metaphorInstruction;
  }

  try {
      // Generate Image
      const response = await ai.models.generateContent({
        model,
        contents: {
           parts: [{ text: finalPrompt }]
        },
        config: {
           imageConfig: { aspectRatio: aspectRatio as any } 
        }
      });
      
      // Extract Image URL (Base64)
      for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
              return { 
                  data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, 
                  inputTokens: 0, 
                  outputTokens: 0 
              };
          }
      }
      return { data: null, inputTokens: 0, outputTokens: 0 };
  } catch (e) {
      console.error("Image Generation Failed", e);
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
  // Use a generic persona name since it's not passed, visual style handles the look.
  const personaName = "Audience"; 

  // Slide 1: Hook
  const r1 = await generateCreativeImage(
      project, personaName, angle, format, 
      visualScene, visualStyle, 
      `${technicalPrompt} -- Slide 1: The Hook/Title Card. Visual Focus: The Problem/Concept.`, 
      "1:1"
  );
  if (r1.data) slides.push(r1.data);
  totalInput += r1.inputTokens;
  totalOutput += r1.outputTokens;

  // Slide 2: Value
  const r2 = await generateCreativeImage(
      project, personaName, angle, format, 
      visualScene, visualStyle, 
      `${technicalPrompt} -- Slide 2: The Mechanism/Process. Visual Focus: How it works.`, 
      "1:1"
  );
  if (r2.data) slides.push(r2.data);
  totalInput += r2.inputTokens;
  totalOutput += r2.outputTokens;

  // Slide 3: CTA
  const r3 = await generateCreativeImage(
      project, personaName, angle, format, 
      visualScene, visualStyle, 
      `${technicalPrompt} -- Slide 3: The Payoff/CTA. Visual Focus: Result/Product.`, 
      "1:1"
  );
  if (r3.data) slides.push(r3.data);
  totalInput += r3.inputTokens;
  totalOutput += r3.outputTokens;

  return {
      data: slides,
      inputTokens: totalInput,
      outputTokens: totalOutput
  };
};