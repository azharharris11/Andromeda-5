
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
  
  // === LOGIC UPGRADE: UNAWARE STAGE PRODUCT LEAKAGE PREVENTION ===
  const isHiddenPhase = project.marketAwareness === MarketAwareness.UNAWARE || project.marketAwareness === MarketAwareness.PROBLEM_AWARE;
  let contextInjection = "";

  if (isHiddenPhase) {
      // FOKUS PADA MASALAH/GEJALA, BUKAN PRODUK
      contextInjection = `(Context: Subject is experiencing the PROBLEM of ${angle}. Do NOT show any branded products, boxes, or logos. This is a generic life scene.)`;
  } else {
      // BARU TAMPILKAN PRODUK
      contextInjection = `(Context: Product is ${project.productName} - ${project.productDescription}. Headline to match: "${angle}").`;
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
    format === CreativeFormat.EDUCATIONAL_RANT; // Added here for UGC base

  // === LOGIC BRANCHING ===

  if (isUglyFormat) {
      appliedEnhancer = trashTierEnhancers;
      
      if (format === CreativeFormat.MS_PAINT) {
          finalPrompt = `A crude, badly drawn MS Paint illustration related to ${project.productName}. Stick figures, comic sans text, bright primary colors, looks like a child or amateur drew it. Authentically bad internet meme style. ${SAFETY_GUIDELINES}`;
      } else if (format === CreativeFormat.UGLY_VISUAL) {
          finalPrompt = `A very low quality, cursed image vibe. ${technicalPrompt || visualScene}. ${trashTierEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}.`;
      } else {
          finalPrompt = `${technicalPrompt}. ${trashTierEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
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
      finalPrompt = `${contextInjection} ${technicalPrompt}. ${culturePrompt} ${moodPrompt} ${appliedEnhancer} ${SAFETY_GUIDELINES}. (Note: This is a service, do not show a retail box. Show the person experiencing the result).`;
  }
  else {
     if (technicalPrompt && technicalPrompt.length > 20) {
         finalPrompt = `${contextInjection} ${technicalPrompt}. ${leadMagnetInstruction} ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
     } else {
         finalPrompt = `${contextInjection} ${visualScene}. Style: ${visualStyle || getRandomStyle()}. ${leadMagnetInstruction} ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
     }
  }

  const parts: any[] = [{ text: finalPrompt }];
  
  if (referenceImageBase64) {
      const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
      parts.unshift({
          inlineData: { mimeType: "image/png", data: base64Data }
      });
      parts.push({ text: "Use this image as a strict character/style reference. Maintain the same person/environment but change the pose/action as described." });
  } 
  else if (project.productReferenceImage) {
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
    
    let anchorImage: string | undefined = undefined;

    for (let i = 1; i <= 3; i++) {
        let slidePrompt = "";
        
        if (format === CreativeFormat.CAROUSEL_REAL_STORY) {
             if (i === 1) slidePrompt = `Slide 1 (The Hook): A candid, slightly imperfect UGC-style photo showing the PROBLEM or PAIN POINT. The subject looks frustrated or tired. Context: ${angle}. Style: Handheld camera.`;
             if (i === 2) slidePrompt = `Slide 2 (The Turn): The SAME subject discovers ${project.productName}. A close up shot of the product/service in use. Natural lighting.`;
             if (i === 3) slidePrompt = `Slide 3 (The Result): The SAME subject looks relieved and happy. A glowing transformation result. Text overlay implied: "Saved my life".`;
        } 
        else if (format === CreativeFormat.CAROUSEL_EDUCATIONAL) {
             if (i === 1) slidePrompt = `Slide 1 (Title Card): Minimalist background with plenty of negative space for text. Visual icon representing the topic: ${angle}.`;
             if (i === 2) slidePrompt = `Slide 2 (The Method): A diagram or clear photo demonstrating the 'How To' aspect of the solution. Keep style consistent.`;
             if (i === 3) slidePrompt = `Slide 3 (Summary): A checklist visual or a final result shot showing success.`;
        }
        else {
            if (i === 1) slidePrompt = `${technicalPrompt}. Slide 1: The Hook/Problem. High tension visual.`;
            if (i === 2) slidePrompt = `${technicalPrompt}. Slide 2: The Solution/Process. Detailed macro shot. Keep visual identity.`;
            if (i === 3) slidePrompt = `${technicalPrompt}. Slide 3: The Result/CTA. Happy resolution.`;
        }

        // Add character consistency text reinforcement
        if (i > 1) {
             slidePrompt += " IMPORTANT: MAINTAIN CHARACTER CONSISTENCY. Same subject as Slide 1. Same hair, same clothes.";
        }

        const result = await generateCreativeImage(
            project, "User", angle, format, visualScene, visualStyle, slidePrompt, "1:1",
            anchorImage 
        );
        
        if (result.data) {
            slides.push(result.data);
            if (i === 1) anchorImage = result.data; 
        }
        totalInput += result.inputTokens;
        totalOutput += result.outputTokens;
    }

    return { data: slides, inputTokens: totalInput, outputTokens: totalOutput };
};
