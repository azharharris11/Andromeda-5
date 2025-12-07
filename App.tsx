
import React, { useState, useRef } from 'react';
import { HashRouter } from 'react-router-dom';
import Canvas, { CanvasHandle } from './components/Canvas';
import Inspector from './components/Inspector';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ConfigModal from './components/ConfigModal';
import FormatSelector from './components/FormatSelector';
import { NodeType, NodeData, Edge, ProjectContext, CreativeFormat, CampaignStage, ViewMode, FunnelStage, MarketAwareness, CopyFramework, AnalysisPhase } from './types';
import { generatePersonas, generateAngles, generateCreativeImage, generateAdCopy, generateCarouselSlides, generateCreativeConcept, checkAdCompliance, analyzeLandingPageContext, analyzeImageContext, generateStoryResearch, generateBigIdeas, generateMechanisms, generateHooks, generateSalesLetter } from './services/geminiService';

const INITIAL_PROJECT: ProjectContext = {
  productName: "Zenith Focus Gummies",
  productDescription: "Nootropic gummies for focus and memory without the caffeine crash.",
  targetAudience: "Students, Programmers, and Creatives.",
  targetCountry: "USA",
  brandVoice: "Witty, Smart, but Approachable",
  brandVoiceOptions: ["Witty, Smart, but Approachable", "Professional & Scientific", "Gen-Z & Meme-Friendly", "Minimalist & Zen", "High-Energy & Aggressive"],
  funnelStage: FunnelStage.TOF,
  marketAwareness: MarketAwareness.PROBLEM_AWARE,
  copyFramework: CopyFramework.PAS,
  offer: "Buy 2 Get 1 Free",
  offerOptions: ["Buy 2 Get 1 Free", "50% Off First Order", "Free Shipping Worldwide", "Bundle & Save 30%", "$10 Welcome Coupon"]
};

// --- SIMULATION BENCHMARKS ---
const FORMAT_BENCHMARKS: Record<string, { ctr: number, cvr: number }> = {
    // High Engagement, Low Sales (Top of Funnel)
    [CreativeFormat.MEME]: { ctr: 2.5, cvr: 0.5 },
    [CreativeFormat.TWITTER_REPOST]: { ctr: 2.0, cvr: 0.8 },
    [CreativeFormat.REDDIT_THREAD]: { ctr: 2.2, cvr: 0.7 },
    
    // Balanced (Middle of Funnel)
    [CreativeFormat.UGC_MIRROR]: { ctr: 1.5, cvr: 1.2 },
    [CreativeFormat.STORY_QNA]: { ctr: 1.4, cvr: 1.0 },
    [CreativeFormat.CAROUSEL_REAL_STORY]: { ctr: 1.8, cvr: 1.3 },
    
    // High Sales, Low Engagement (Bottom of Funnel / Logic)
    [CreativeFormat.US_VS_THEM]: { ctr: 0.9, cvr: 2.5 },
    [CreativeFormat.BENEFIT_POINTERS]: { ctr: 1.0, cvr: 2.2 },
    [CreativeFormat.STICKY_NOTE_REALISM]: { ctr: 1.3, cvr: 1.8 },
    [CreativeFormat.GRAPH_CHART]: { ctr: 0.7, cvr: 2.0 },
    
    // Default
    "DEFAULT": { ctr: 1.0, cvr: 1.0 }
};

const FORMAT_GROUPS: Record<string, CreativeFormat[]> = {
  "Carousel Specials (High Engagement)": [
    CreativeFormat.CAROUSEL_REAL_STORY, // NEW
    CreativeFormat.CAROUSEL_EDUCATIONAL,
    CreativeFormat.CAROUSEL_TESTIMONIAL,
    CreativeFormat.CAROUSEL_PANORAMA,
    CreativeFormat.CAROUSEL_PHOTO_DUMP,
  ],
  "Instagram Native": [
    CreativeFormat.STORY_QNA, 
    CreativeFormat.STORY_POLL,
    CreativeFormat.REELS_THUMBNAIL,
    CreativeFormat.DM_NOTIFICATION,
    CreativeFormat.UGC_MIRROR,
    CreativeFormat.PHONE_NOTES,
    CreativeFormat.TWITTER_REPOST,
  ],
  "Direct Response Winners": [
    CreativeFormat.BENEFIT_POINTERS, // NEW
    CreativeFormat.SOCIAL_COMMENT_STACK, // NEW
    CreativeFormat.STICKY_NOTE_REALISM, // NEW
    CreativeFormat.HANDHELD_TWEET, // NEW
  ],
  "Logic & Rational": [
    CreativeFormat.US_VS_THEM,
    CreativeFormat.GRAPH_CHART,
    CreativeFormat.TIMELINE_JOURNEY,
  ],
  "Social Proof & Voyeurism": [
    CreativeFormat.CHAT_CONVERSATION,
    CreativeFormat.REMINDER_NOTIF,
  ],
  "Product Centric": [
    CreativeFormat.POV_HANDS,
    CreativeFormat.ANNOTATED_PRODUCT,
    CreativeFormat.SEARCH_BAR,
  ],
  "Aesthetic & Mood": [
    CreativeFormat.COLLAGE_SCRAPBOOK,
    CreativeFormat.CHECKLIST_TODO,
    CreativeFormat.AESTHETIC_MINIMAL,
  ],
  "Pattern Interrupts": [
    CreativeFormat.BIG_FONT,
    CreativeFormat.GMAIL_UX,
    CreativeFormat.UGLY_VISUAL,
    CreativeFormat.MS_PAINT,
    CreativeFormat.MEME,
    CreativeFormat.LONG_TEXT,
    CreativeFormat.BEFORE_AFTER,
    CreativeFormat.CARTOON,
    CreativeFormat.WHITEBOARD,
    CreativeFormat.REDDIT_THREAD
  ]
};

const App = () => {
  const [project, setProject] = useState<ProjectContext>(INITIAL_PROJECT);
  const [activeView, setActiveView] = useState<ViewMode>('LAB');
  
  const [nodes, setNodes] = useState<NodeData[]>([
    {
      id: 'root',
      type: NodeType.ROOT,
      title: INITIAL_PROJECT.productName,
      description: INITIAL_PROJECT.productDescription,
      x: 0,
      y: 0,
      stage: CampaignStage.TESTING
    }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [targetNodeIdForFormat, setTargetNodeIdForFormat] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<Set<CreativeFormat>>(new Set());
  
  const canvasRef = useRef<CanvasHandle>(null);

  const labNodes = nodes.filter(n => n.stage === CampaignStage.TESTING || n.isGhost);
  const labEdges = edges.filter(e => {
      const source = nodes.find(n => n.id === e.source);
      const target = nodes.find(n => n.id === e.target);
      return (source?.stage === CampaignStage.TESTING || source?.isGhost) && 
             (target?.stage === CampaignStage.TESTING || target?.isGhost);
  });
  const vaultNodes = nodes.filter(n => n.stage === CampaignStage.SCALING);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const addNode = (node: NodeData) => { setNodes(prev => [...prev, node]); };
  const addEdge = (source: string, target: string) => { setEdges(prev => [...prev, { id: `${source}-${target}`, source, target }]); };
  const updateNode = (id: string, updates: Partial<NodeData>) => { setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n)); };
  
  const handleNodeMove = (id: string, x: number, y: number) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  // --- CONFIG HANDLERS ---
  const handleProjectUpdate = (updates: Partial<ProjectContext>) => {
      setProject(prev => ({...prev, ...updates}));
  };

  const handleContextAnalyzed = (context: ProjectContext) => {
      setProject(prev => ({...prev, ...context}));
      // Update Root Node to reflect new product details
      setNodes(prev => prev.map(n => n.type === NodeType.ROOT ? {
          ...n,
          title: context.productName,
          description: context.productDescription
      } : n));
  };

  // New: Handle Regeneration from Inspector
  const handleRegenerateNode = async (nodeId: string, aspectRatio: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    updateNode(nodeId, { isLoading: true, description: "Regenerating visual..." });

    try {
        const personaName = node.meta?.personaName || "User";
        const angle = node.meta?.angle || node.title;
        const visualScene = node.meta?.visualScene || node.meta?.styleContext || ""; 
        const visualStyle = node.meta?.visualStyle || "";
        const technicalPrompt = node.meta?.technicalPrompt || "";
        const format = node.format as CreativeFormat;

        const imgResult = await generateCreativeImage(
            project, personaName, angle, format, 
            visualScene, visualStyle, technicalPrompt, 
            aspectRatio
        );
        
        if (imgResult.data) {
            updateNode(nodeId, { 
                imageUrl: imgResult.data,
                isLoading: false,
                description: node.adCopy?.primaryText.slice(0, 100) + "..." || node.description
            });
        } else {
            updateNode(nodeId, { isLoading: false, description: "Regeneration failed." });
        }
    } catch (e) {
        console.error("Regeneration failed", e);
        updateNode(nodeId, { isLoading: false, description: "Error during regeneration" });
    }
  };

  const executeGeneration = async (parentNodeId: string, formats: CreativeFormat[]) => {
    const parentNode = nodes.find(n => n.id === parentNodeId);
    if (!parentNode) return;

    updateNode(parentNodeId, { isLoading: true });

    // Grid Layout Constants
    const HORIZONTAL_GAP = 550; 
    const COL_SPACING = 350;    
    const ROW_SPACING = 400;    
    const COLUMNS = 3;

    const totalRows = Math.ceil(formats.length / COLUMNS);
    const totalBlockHeight = (totalRows - 1) * ROW_SPACING;
    const startY = parentNode.y - (totalBlockHeight / 2);

    const newNodes: NodeData[] = [];
    
    // Determine context based on parent node type (Shortcuts logic)
    let angleToUse = parentNode.title;
    if (parentNode.type === NodeType.HOOK_NODE && parentNode.hookData) angleToUse = parentNode.hookData;
    else if (parentNode.type === NodeType.BIG_IDEA_NODE && parentNode.bigIdeaData) angleToUse = parentNode.bigIdeaData.headline;
    else if (parentNode.type === NodeType.MECHANISM_NODE && parentNode.mechanismData) angleToUse = parentNode.mechanismData.scientificPseudo;
    
    // Determine Persona Name
    const personaToUse = parentNode.meta?.personaName || "Story Protagonist";
    
    formats.forEach((format, index) => {
      const row = Math.floor(index / COLUMNS);
      const col = index % COLUMNS;
      
      const newId = `creative-${Date.now()}-${index}`;
      const nodeData: NodeData = {
        id: newId, 
        type: NodeType.CREATIVE, 
        parentId: parentNodeId,
        title: format, 
        description: "Initializing Generation...", 
        format: format,
        isLoading: true, 
        x: parentNode.x + HORIZONTAL_GAP + (col * COL_SPACING), 
        y: startY + (row * ROW_SPACING),
        stage: CampaignStage.TESTING,
        meta: { 
            personaName: personaToUse, 
            angle: angleToUse, 
        }
      };
      newNodes.push(nodeData);
      addNode(nodeData);
      addEdge(parentNodeId, newId);
    });

    // GENERATION PROCESS
    for (const node of newNodes) {
        // Stagger execution slightly to prevent immediate rate limits
        if (newNodes.indexOf(node) > 0) await new Promise(resolve => setTimeout(resolve, 800));

        try {
            // DETECT IF PARENT IS HOOK OR ANGLE
            const isHookSource = parentNode.type === NodeType.HOOK_NODE;
            // Also enable shortcut from Big Idea or Mechanism or Story
            const isShortcut = parentNode.type === NodeType.BIG_IDEA_NODE || parentNode.type === NodeType.MECHANISM_NODE || parentNode.type === NodeType.STORY_NODE;

            const fmt = node.format as CreativeFormat;
            
            let accumulatedInput = 0;
            let accumulatedOutput = 0;
            let imageCount = 0;
            let finalAdCopy: any = {};
            let visualConcept: any = {};

            // --- BRANCH A: STANDARD FLOW (FROM ANGLE) ---
            if (!isHookSource && !isShortcut) {
                 // 1. STRATEGIST AGENT
                 updateNode(node.id, { description: "Art Director: Defining visual style..." });
                 const conceptResult = await generateCreativeConcept(project, personaToUse, angleToUse, fmt);
                 accumulatedInput += conceptResult.inputTokens;
                 accumulatedOutput += conceptResult.outputTokens;
                 visualConcept = conceptResult.data;

                 // 2. COPYWRITER AGENT
                 updateNode(node.id, { description: "Copywriter: Drafting..." });
                 const copyResult = await generateAdCopy(project, parentNode.meta || { name: personaToUse }, visualConcept);
                 accumulatedInput += copyResult.inputTokens;
                 accumulatedOutput += copyResult.outputTokens;
                 finalAdCopy = copyResult.data;
            } 
            
            // --- BRANCH B: MEGAPROMPT / SHORTCUT FLOW ---
            else {
                 // 1. GENERATE SALES LETTER (To be used as Caption)
                 // If we have full context (Hook Node), use full generator.
                 if (isHookSource && parentNode.storyData && parentNode.bigIdeaData && parentNode.mechanismData && parentNode.hookData) {
                    updateNode(node.id, { description: "Writing Caption..." });
                    const letterResult = await generateSalesLetter(project, parentNode.storyData, parentNode.bigIdeaData, parentNode.mechanismData, parentNode.hookData);
                    accumulatedInput += letterResult.inputTokens;
                    accumulatedOutput += letterResult.outputTokens;
                    
                    finalAdCopy = {
                        headline: parentNode.hookData,
                        primaryText: letterResult.data, 
                        cta: project.offer || "Learn More"
                    };
                 } else {
                     // Shortcut path: Use standard copy generator with inferred context
                     updateNode(node.id, { description: "Copywriter: Drafting (Shortcut)..." });
                     // Need a dummy concept first to feed copywriter
                     const conceptResult = await generateCreativeConcept(project, personaToUse, angleToUse, fmt);
                     accumulatedInput += conceptResult.inputTokens;
                     accumulatedOutput += conceptResult.outputTokens;
                     visualConcept = conceptResult.data;
                     
                     const copyResult = await generateAdCopy(project, { name: personaToUse }, visualConcept);
                     accumulatedInput += copyResult.inputTokens;
                     accumulatedOutput += copyResult.outputTokens;
                     finalAdCopy = copyResult.data;
                 }

                 // 2. GENERATE VISUAL CONCEPT (If not already generated in shortcut)
                 if (!visualConcept.visualScene) {
                     updateNode(node.id, { description: "Art Director: Visualizing..." });
                     const conceptResult = await generateCreativeConcept(project, personaToUse, angleToUse, fmt);
                     accumulatedInput += conceptResult.inputTokens;
                     accumulatedOutput += conceptResult.outputTokens;
                     visualConcept = conceptResult.data;
                 }
            }

            // 3. COMPLIANCE CHECK
            const complianceStatus = await checkAdCompliance(finalAdCopy);
            finalAdCopy.complianceNotes = complianceStatus;

            // 4. VISUALIZER AGENT (Common for both)
            updateNode(node.id, { description: "Visualizer: Rendering..." });
            const imgResult = await generateCreativeImage(
                project, personaToUse, angleToUse, fmt, 
                visualConcept.visualScene, visualConcept.visualStyle, visualConcept.technicalPrompt, "1:1"
            );
            
            accumulatedInput += imgResult.inputTokens;
            accumulatedOutput += imgResult.outputTokens;
            const imageUrl = imgResult.data;
            if (imageUrl) imageCount++;

            // 5. CAROUSEL HANDLER
            let carouselImages: string[] = [];
            const isCarousel = (
                fmt === CreativeFormat.CAROUSEL_EDUCATIONAL ||
                fmt === CreativeFormat.CAROUSEL_TESTIMONIAL ||
                fmt === CreativeFormat.CAROUSEL_PANORAMA ||
                fmt === CreativeFormat.CAROUSEL_PHOTO_DUMP ||
                fmt === CreativeFormat.CAROUSEL_REAL_STORY 
            );
            
            if (isCarousel) {
                const slidesResult = await generateCarouselSlides(
                    project, fmt, angleToUse, visualConcept.visualScene, visualConcept.visualStyle, visualConcept.technicalPrompt
                );
                accumulatedInput += slidesResult.inputTokens;
                accumulatedOutput += slidesResult.outputTokens;
                carouselImages = slidesResult.data;
                imageCount += carouselImages.length;
            }

            const inputCost = (accumulatedInput / 1000000) * 0.30;
            const outputCost = (accumulatedOutput / 1000000) * 2.50;
            const imgCost = imageCount * 0.039;
            const totalCost = inputCost + outputCost + imgCost;

            updateNode(node.id, { 
                isLoading: false, 
                description: finalAdCopy.primaryText.slice(0, 100) + "...",
                imageUrl: imageUrl || undefined,
                carouselImages: carouselImages.length > 0 ? carouselImages : undefined,
                adCopy: finalAdCopy,
                inputTokens: accumulatedInput,
                outputTokens: accumulatedOutput,
                estimatedCost: totalCost,
                meta: { 
                    ...node.meta, 
                    visualScene: visualConcept.visualScene, 
                    visualStyle: visualConcept.visualStyle, 
                    technicalPrompt: visualConcept.technicalPrompt 
                }, 
                variableIsolated: visualConcept.rationale 
            });
        } catch (e) {
            console.error("Error generating creative node", e);
            updateNode(node.id, { isLoading: false, description: "Generation Failed" });
        }
    }
    updateNode(parentNodeId, { isLoading: false });
  };

  const handleNodeAction = async (action: string, nodeId: string, optionId?: string) => {
    const parentNode = nodes.find(n => n.id === nodeId);
    if (!parentNode) return;

    // --- STANDARD WORKFLOW ACTIONS ---
    if (action === 'expand_personas') {
      updateNode(nodeId, { isLoading: true });
      try {
          const result = await generatePersonas(project);
          const personas = result.data;
          
          const HORIZONTAL_GAP = 600;
          const VERTICAL_SPACING = 800;
          const totalHeight = (personas.length - 1) * VERTICAL_SPACING;
          const startY = parentNode.y - (totalHeight / 2);
          
          personas.forEach((p: any, index: number) => {
            const newNodeId = `persona-${Date.now()}-${index}`;
            addNode({
              id: newNodeId, type: NodeType.PERSONA, parentId: nodeId,
              title: p.name, 
              description: `${p.profile || p.motivation}`,
              x: parentNode.x + HORIZONTAL_GAP, y: startY + (index * VERTICAL_SPACING),
              meta: p, stage: CampaignStage.TESTING,
              inputTokens: result.inputTokens / 3, 
              outputTokens: result.outputTokens / 3,
              estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
            });
            addEdge(nodeId, newNodeId);
          });
      } catch (e) { alert("Quota exceeded."); }
      updateNode(nodeId, { isLoading: false });
    }

    if (action === 'expand_angles') {
      updateNode(nodeId, { isLoading: true });
      try {
          const pMeta = parentNode.meta || {};
          const result = await generateAngles(project, pMeta.name, pMeta.motivation);
          const angles = result.data;
          
          const HORIZONTAL_GAP = 550;
          const VERTICAL_SPACING = 350;
          const totalHeight = (angles.length - 1) * VERTICAL_SPACING;
          const startY = parentNode.y - (totalHeight / 2);

          angles.forEach((a: any, index: number) => {
            const newNodeId = `angle-${Date.now()}-${index}`;
            addNode({
              id: newNodeId, type: NodeType.ANGLE, parentId: nodeId,
              title: a.headline, description: `Hook: ${a.painPoint}`,
              x: parentNode.x + HORIZONTAL_GAP, y: startY + (index * VERTICAL_SPACING),
              meta: { ...a, personaName: pMeta.name }, stage: CampaignStage.TESTING,
              testingTier: a.testingTier, // NEW
              inputTokens: result.inputTokens / 3,
              outputTokens: result.outputTokens / 3,
              estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
            });
            addEdge(nodeId, newNodeId);
          });
      } catch (e) { alert("Quota exceeded."); }
      updateNode(nodeId, { isLoading: false });
    }

    if (action === 'generate_creatives') {
      setTargetNodeIdForFormat(nodeId);
      setIsFormatModalOpen(true);
    }

    if (action === 'promote_creative') {
       const newId = `${nodeId}-vault`;
       addNode({
           ...parentNode,
           id: newId,
           stage: CampaignStage.SCALING,
           x: 0, 
           y: 0,
           parentId: null
       });
       updateNode(nodeId, { isGhost: true });
       setActiveView('VAULT');
    }

    // --- MEGAPROMPT WORKFLOW (MINDMAP BRANCHING LOGIC) ---
    // 1. ROOT -> 3 STORY NODES
    if (action === 'start_story_flow') {
        updateNode(nodeId, { isLoading: true });
        try {
            const result = await generateStoryResearch(project);
            const stories = result.data;
            const HORIZONTAL_GAP = 500;
            const VERTICAL_SPACING = 400;
            const totalHeight = (stories.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            stories.forEach((story, index) => {
                const newNodeId = `story-${Date.now()}-${index}`;
                addNode({
                    id: newNodeId,
                    type: NodeType.STORY_NODE, // BRANCH: Story Node
                    parentId: nodeId,
                    title: story.title,
                    description: "Story Phase",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    storyData: story, 
                    stage: CampaignStage.TESTING,
                    inputTokens: result.inputTokens / 3,
                    outputTokens: result.outputTokens / 3,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
                });
                addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); alert("Generation failed"); }
        updateNode(nodeId, { isLoading: false });
    }

    // 2. STORY NODE -> 3 BIG IDEA NODES
    if (action === 'generate_big_ideas') {
        const story = parentNode.storyData;
        if (!story) return;
        updateNode(nodeId, { isLoading: true });
        try {
            const result = await generateBigIdeas(project, story);
            const ideas = result.data;
            const HORIZONTAL_GAP = 500;
            const VERTICAL_SPACING = 300;
            const totalHeight = (ideas.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            ideas.forEach((idea, index) => {
                 const newNodeId = `big-idea-${Date.now()}-${index}`;
                 addNode({
                    id: newNodeId,
                    type: NodeType.BIG_IDEA_NODE, 
                    parentId: nodeId,
                    title: idea.headline,
                    description: "Big Idea Phase",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    storyData: story, 
                    bigIdeaData: idea, 
                    stage: CampaignStage.TESTING,
                    inputTokens: result.inputTokens / 3,
                    outputTokens: result.outputTokens / 3,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
                 });
                 addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); }
        updateNode(nodeId, { isLoading: false });
    }

    // 3. BIG IDEA NODE -> 3 MECHANISM NODES
    if (action === 'generate_mechanisms') {
        const bigIdea = parentNode.bigIdeaData;
        if (!bigIdea) return;
        updateNode(nodeId, { isLoading: true });
        try {
            const result = await generateMechanisms(project, bigIdea);
            const mechanisms = result.data;
            const HORIZONTAL_GAP = 500;
            const VERTICAL_SPACING = 300;
            const totalHeight = (mechanisms.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            mechanisms.forEach((mech, index) => {
                 const newNodeId = `mechanism-${Date.now()}-${index}`;
                 addNode({
                    id: newNodeId,
                    type: NodeType.MECHANISM_NODE, 
                    parentId: nodeId,
                    title: mech.scientificPseudo,
                    description: "Mechanism Phase",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    storyData: parentNode.storyData,
                    bigIdeaData: bigIdea,
                    mechanismData: mech, 
                    stage: CampaignStage.TESTING,
                    inputTokens: result.inputTokens / 3,
                    outputTokens: result.outputTokens / 3,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
                 });
                 addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); }
        updateNode(nodeId, { isLoading: false });
    }

    // 4. MECHANISM NODE -> 5 HOOK NODES
    if (action === 'generate_hooks') {
        const mechanism = parentNode.mechanismData;
        if (!mechanism) return;
        updateNode(nodeId, { isLoading: true });
        try {
            const bigIdea = parentNode.bigIdeaData;
            if (!bigIdea) return; 
            const result = await generateHooks(project, bigIdea, mechanism);
            const hooks = result.data;
            const HORIZONTAL_GAP = 400;
            const VERTICAL_SPACING = 200;
            const totalHeight = (hooks.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            hooks.forEach((hook, index) => {
                const newNodeId = `hook-${Date.now()}-${index}`;
                addNode({
                    id: newNodeId,
                    type: NodeType.HOOK_NODE, 
                    parentId: nodeId,
                    title: "Hook Variation",
                    description: "Hook Phase",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    storyData: parentNode.storyData,
                    bigIdeaData: bigIdea,
                    mechanismData: mechanism,
                    hookData: hook, 
                    stage: CampaignStage.TESTING,
                    inputTokens: result.inputTokens / 5,
                    outputTokens: result.outputTokens / 5,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 5
                });
                addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); }
        updateNode(nodeId, { isLoading: false });
    }

    // 5. HOOK NODE -> OPEN FORMAT SELECTOR
    if (action === 'open_format_selector') {
        setTargetNodeIdForFormat(nodeId);
        setIsFormatModalOpen(true);
    }
  };

  const runSimulation = () => {
    setSimulating(true);
    const creatives = nodes.filter(n => n.type === NodeType.CREATIVE && n.stage === CampaignStage.TESTING && !n.isGhost);
    
    creatives.forEach(node => {
        const currentAge = (node.metrics?.ageHours || 0) + 24;
        let phase = AnalysisPhase.PHASE_1;
        if (currentAge > 72 && currentAge <= 168) phase = AnalysisPhase.PHASE_2;
        if (currentAge > 168 && currentAge <= 336) phase = AnalysisPhase.PHASE_3;
        if (currentAge > 336) phase = AnalysisPhase.PHASE_4;

        // REALISTIC LOGIC ENGINE
        const fmt = node.format as CreativeFormat;
        const benchmark = FORMAT_BENCHMARKS[fmt] || FORMAT_BENCHMARKS["DEFAULT"];
        const variance = 0.7 + (Math.random() * 0.6);
        const spend = (node.metrics?.spend || 0) + (Math.floor(Math.random() * 50) + 20);
        const ctr = parseFloat((benchmark.ctr * variance).toFixed(2));
        let ageFactor = 1.0;
        if (currentAge > 72) ageFactor = 1.1; 
        if (currentAge > 300) ageFactor = 0.8; 
        const roas = parseFloat((benchmark.cvr * variance * ageFactor).toFixed(2));
        const cpa = Math.floor((30 / roas) * variance);

        let aiInsight = "";
        let isWinning = false, isLosing = false;

        if (phase === AnalysisPhase.PHASE_1) {
             aiInsight = "PHASE 1 (Learning): Volatility detected. Do not touch. 72-hour rule active.";
        }
        else if (phase === AnalysisPhase.PHASE_2) {
             if (ctr < 0.8) { isLosing = true; aiInsight = "PHASE 2 (Health): CTR < 0.8%. Creative fatigue or boring hook. Kill."; } 
             else { aiInsight = "PHASE 2 (Health): Healthy CTR. Monitoring backend conversion."; }
        }
        else if (phase === AnalysisPhase.PHASE_3) {
             if (roas > 2.0) { isWinning = true; aiInsight = "PHASE 3 (Eval): Winner detected (ROAS > 2.0). Ready for Scale."; } 
             else if (roas < 1.0) { isLosing = true; aiInsight = "PHASE 3 (Eval): Unprofitable (ROAS < 1.0). Kill."; } 
             else { aiInsight = "PHASE 3 (Eval): Breakeven. Iterate Angle."; }
        }
        else {
             if (roas > 2.0) isWinning = true;
             aiInsight = "PHASE 4 (Scale): Horizontal scaling recommended.";
        }
        
        updateNode(node.id, {
            metrics: { spend, cpa, roas, impressions: spend * 40, ctr, ageHours: currentAge },
            analysisPhase: phase, isWinning, isLosing, aiInsight
        });
    });
    setTimeout(() => setSimulating(false), 1500);
  };

  const handleSelectFormat = (fmt: CreativeFormat) => {
      const newSet = new Set(selectedFormats);
      if (newSet.has(fmt)) newSet.delete(fmt);
      else newSet.add(fmt);
      setSelectedFormats(newSet);
  };

  const confirmFormatSelection = () => {
      if (targetNodeIdForFormat && selectedFormats.size > 0) {
          executeGeneration(targetNodeIdForFormat, Array.from(selectedFormats));
          setIsFormatModalOpen(false);
          setSelectedFormats(new Set());
          setTargetNodeIdForFormat(null);
      }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && isConfigOpen) {
       // Note: Drop logic inside config modal is simplified for this refactor.
       // It's handled inside ConfigModal mostly via onClick upload, but dragging to background 
       // is less critical to implement right now if modal is open.
       // We can rely on the modal's input area.
    }
  };

  return (
    <HashRouter>
    <div className="w-screen h-screen bg-slate-50 flex overflow-hidden text-slate-900" onDragOver={handleDragOver} onDrop={handleDrop}>
      <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          onOpenConfig={() => setIsConfigOpen(true)} 
      />
      <div className="flex-1 relative">
        <Canvas 
          ref={canvasRef}
          nodes={activeView === 'LAB' ? labNodes : vaultNodes}
          edges={activeView === 'LAB' ? labEdges : []}
          onNodeAction={handleNodeAction}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onNodeMove={handleNodeMove}
        />
        <Header 
            activeView={activeView}
            labNodesCount={labNodes.length}
            vaultNodesCount={vaultNodes.length}
            simulating={simulating}
            onRunSimulation={runSimulation}
        />
      </div>
      {selectedNode && (
          <div className="w-[400px] h-full z-30 relative">
            <Inspector node={selectedNode} onClose={() => setSelectedNodeId(null)} onUpdate={updateNode} onRegenerate={handleRegenerateNode} onPromote={(id) => handleNodeAction('promote_creative', id)} project={project} />
          </div>
      )}
      <ConfigModal 
          isOpen={isConfigOpen} 
          onClose={() => setIsConfigOpen(false)} 
          project={project} 
          onUpdateProject={handleProjectUpdate}
          onContextAnalyzed={handleContextAnalyzed}
      />
      <FormatSelector 
          isOpen={isFormatModalOpen}
          onClose={() => setIsFormatModalOpen(false)}
          selectedFormats={selectedFormats}
          onSelectFormat={handleSelectFormat}
          onConfirm={confirmFormatSelection}
          formatGroups={FORMAT_GROUPS}
      />
    </div>
    </HashRouter>
  );
};

export default App;
