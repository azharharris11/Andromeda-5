

export enum NodeType {
  ROOT = 'ROOT',
  PERSONA = 'PERSONA',
  ANGLE = 'ANGLE',
  CREATIVE = 'CREATIVE',
  
  // --- STORY LEAD MEGAPROMPT NODES ---
  STORY_NODE = 'STORY_NODE',         // Single Story
  BIG_IDEA_NODE = 'BIG_IDEA_NODE',   // Single Big Idea
  MECHANISM_NODE = 'MECHANISM_NODE', // Single Mechanism
  HOOK_NODE = 'HOOK_NODE',           // Single Hook
  SALES_LETTER = 'SALES_LETTER'      // Final Output
}

export enum CreativeFormat {
  // --- CAROUSEL SPECIALS (NEW) ---
  CAROUSEL_EDUCATIONAL = 'Carousel: Educational / Tips',
  CAROUSEL_TESTIMONIAL = 'Carousel: Testimonial Pile',
  CAROUSEL_PANORAMA = 'Carousel: Seamless Panorama',
  CAROUSEL_PHOTO_DUMP = 'Carousel: Photo Dump / Recap',
  CAROUSEL_REAL_STORY = 'Carousel: Real People Story (UGC)', // NEW

  // Previous Performers
  BIG_FONT = 'Big Font / Text Heavy',
  GMAIL_UX = 'Gmail / Letter Style',
  BILLBOARD = 'Billboard Ad',
  UGLY_VISUAL = 'Ugly Visual / Problem Focus',
  MS_PAINT = 'MS Paint / Nostalgia',
  REDDIT_THREAD = 'Reddit Thread',
  MEME = 'Meme / Internet Culture',
  LONG_TEXT = 'Long Text / Story',
  CARTOON = 'Cartoon / Illustration',
  BEFORE_AFTER = 'Before & After',
  WHITEBOARD = 'Whiteboard / Diagram',

  // Instagram Native
  TWITTER_REPOST = 'Twitter/X Repost',
  PHONE_NOTES = 'iPhone Notes App',
  AESTHETIC_MINIMAL = 'Aesthetic / Text Overlay',
  STORY_POLL = 'Story: Standard Poll (Yes/No)',
  STORY_QNA = 'Story: Ask Me Anything (Influencer Style)', 
  REELS_THUMBNAIL = 'Reels Cover / Fake Video',
  DM_NOTIFICATION = 'DM Notification',
  UGC_MIRROR = 'UGC Mirror Selfie',

  // New: Logical & Comparison
  US_VS_THEM = 'Us vs Them / Comparison Table',
  GRAPH_CHART = 'Graph / Data Visualization',
  TIMELINE_JOURNEY = 'Timeline / Roadmap',

  // New: Voyeurism & Social
  CHAT_CONVERSATION = 'Chat Bubble / WhatsApp',
  REMINDER_NOTIF = 'Lockscreen Reminder',
  SOCIAL_COMMENT_STACK = 'Social Comment Stack', 
  HANDHELD_TWEET = 'Handheld Tweet Overlay',     

  // New: Product Centric
  POV_HANDS = 'POV / Hands-on',
  ANNOTATED_PRODUCT = 'Annotated / Feature Breakdown',
  SEARCH_BAR = 'Search Bar UI',
  BENEFIT_POINTERS = 'Benefit Pointers / Anatomy', 

  // New: Aesthetic & Mood
  COLLAGE_SCRAPBOOK = 'Collage / Scrapbook',
  CHECKLIST_TODO = 'Checklist / To-Do',
  STICKY_NOTE_REALISM = 'Sticky Note / Handwritten' 
}

export enum CampaignStage {
  TESTING = 'TESTING', // CBO - High Volume Bid Strategy
  SCALING = 'SCALING'  // Advantage+ / Broad - Cost Cap/ROAS Goal
}

// NEW: Marketing Funnel Stages
export enum FunnelStage {
  TOF = 'Top of Funnel (Cold Awareness)',
  MOF = 'Middle of Funnel (Consideration)',
  BOF = 'Bottom of Funnel (Retargeting/Conversion)'
}

// NEW: Eugene Schwartz Market Awareness Levels
export enum MarketAwareness {
  UNAWARE = 'Unaware (No knowledge of problem)',
  PROBLEM_AWARE = 'Problem Aware (Knows problem, seeks solution)',
  SOLUTION_AWARE = 'Solution Aware (Knows solutions, comparing options)',
  PRODUCT_AWARE = 'Product Aware (Knows you, needs a deal)',
  MOST_AWARE = 'Most Aware (Ready to buy, needs urgency)'
}

// NEW: Direct Response Frameworks
export enum CopyFramework {
  PAS = 'PAS (Problem, Agitation, Solution)',
  AIDA = 'AIDA (Attention, Interest, Desire, Action)',
  BAB = 'BAB (Before, After, Bridge)',
  FAB = 'FAB (Features, Advantages, Benefits)',
  STORY = 'Storytelling / Hero\'s Journey'
}

// ANDROMEDA PLAYBOOK: Testing Tiers
export enum TestingTier {
  TIER_1 = 'TIER 1: Concept Isolation (High Budget)',
  TIER_2 = 'TIER 2: Persona Isolation (Mid Budget)',
  TIER_3 = 'TIER 3: Sprint Isolation (Low Budget)'
}

// ANDROMEDA PLAYBOOK: Analysis Phases
export enum AnalysisPhase {
  PHASE_1 = 'PHASE 1: Launch & Learning (0-72h)',
  PHASE_2 = 'PHASE 2: Health Check (Day 4-7)',
  PHASE_3 = 'PHASE 3: Performance Eval (Day 8-14)',
  PHASE_4 = 'PHASE 4: Scaling Decision (Day 15+)'
}

export type ViewMode = 'LAB' | 'VAULT';

export interface Metrics {
  ageHours: number; // NEW: Track age of ad for Phased Analysis
  spend: number;
  cpa: number;
  roas: number;
  impressions: number;
  ctr: number; // Thumbstop rate
  thumbstopRatio?: number; // 3-second view rate
  holdRate?: number; // Video retention
}

export interface AdCopy {
  primaryText: string;
  headline: string;
  cta: string;
  complianceNotes?: string; 
}

// --- STORY LEAD MEGAPROMPT DATA STRUCTURES ---
export interface StoryOption {
  id: string;
  title: string;
  narrative: string; // The raw "Reddit" story
  emotionalTheme: string; // "Betrayal", "Hope", etc.
}

export interface BigIdeaOption {
  id: string;
  headline: string;
  concept: string; // The "New Opportunity" pitch
  targetBelief: string; // What belief are we shifting?
}

export interface MechanismOption {
  id: string;
  ump: string; // Unique Mechanism of Problem (Why they failed before)
  ums: string; // Unique Mechanism of Solution (Why this works now)
  scientificPseudo: string; // The "Name" of the mechanism
}

export interface NodeData {
  id: string;
  type: NodeType;
  parentId?: string | null;
  
  // Content
  title: string;
  description?: string;
  meta?: Record<string, any>;
  
  // Story Lead Workflow Data - Single Items for Mindmap Nodes
  storyData?: StoryOption;
  bigIdeaData?: BigIdeaOption;
  mechanismData?: MechanismOption;
  hookData?: string;
  
  // Creative specific
  imageUrl?: string; 
  carouselImages?: string[]; 
  format?: CreativeFormat;
  adCopy?: AdCopy; 
  fullSalesLetter?: string; // For SALES_LETTER node
  
  // Audio / Scripting 
  audioScript?: string;
  audioBase64?: string; 
  
  // State
  isLoading?: boolean;
  stage?: CampaignStage; 
  isGhost?: boolean; 
  
  // Performance Data (The Andromeda Metric System)
  metrics?: Metrics;
  analysisPhase?: AnalysisPhase; // NEW
  postId?: string; 
  isWinning?: boolean; 
  isLosing?: boolean;
  aiInsight?: string; 
  
  // Andromeda Logic
  testingTier?: TestingTier; // NEW
  variableIsolated?: string; // NEW (e.g., "Variable: Hook")
  congruenceRationale?: string; // NEW: Why Image matches Text (The Jeans Rule)
  
  // Usage & Cost Tracking 
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;

  // Layout
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface ProjectContext {
  productName: string;
  productDescription: string;
  targetAudience: string;
  landingPageUrl?: string; 
  productReferenceImage?: string; 
  
  // New Strategic Inputs
  targetCountry?: string; 
  brandVoice?: string;
  brandVoiceOptions?: string[]; // NEW: AI generated options
  funnelStage?: FunnelStage;
  
  // NEW: Deep Strategy Inputs
  offer?: string;
  offerOptions?: string[]; // NEW: AI generated options
  marketAwareness?: MarketAwareness;
  copyFramework?: CopyFramework;
}

// Internal Interface for the "Strategist Agent"
export interface CreativeConcept {
  visualScene: string;   
  visualStyle: string;   
  technicalPrompt: string; 
  copyAngle: string;     
  rationale: string;
  congruenceRationale: string; // NEW: The "Why they match"
  // Modular Toolkit Components
  hookComponent?: string; // The "Thumbstop"
  bodyComponent?: string; // The "Reasoning"
  ctaComponent?: string; // The "Action"
}

export interface GenResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
}