import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY is missing. AI commentary will not work.");
  }
  return key || "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface CommentaryBall {
  over: number;
  ball: number;
  commentary: string;
  runs: number;
  isWicket: boolean;
  event: 'dot' | 'single' | 'double' | 'three' | 'four' | 'six' | 'wicket' | 'wide' | 'no-ball';
}

export interface MatchNarration {
  teamA: string;
  teamB: string;
  venue: string;
  overs: CommentaryBall[];
  summary: string;
}

export const STATIC_MATCHES: Record<string, MatchNarration> = {
  "2008_FINAL": {
    teamA: "Rajasthan Royals",
    teamB: "Chennai Super Kings",
    venue: "DY Patil Stadium (Classic Redux)",
    summary: "A tribute to the first ever IPL final. The desert masters vs the yellow brigade!",
    overs: [
      { over: 0, ball: 1, event: 'single', runs: 1, isWicket: false, commentary: "Ram Ram sa! Match shuru ho gayo hai. Niraj ne pehli ball pe single le liya." },
      { over: 0, ball: 2, event: 'dot', runs: 0, isWicket: false, commentary: "Achhi length! Batsman ne samman diya, koi run koni." },
      { over: 0, ball: 3, event: 'four', runs: 4, isWicket: false, commentary: "Chauka laag gayo! Gajab shot covers ke upar se. Shane Warne khush hoya!" },
      { over: 0, ball: 4, event: 'wicket', runs: 0, isWicket: true, commentary: "Oh ho ho! Koni ho sake! Seedha fielder ke haath mein. Badi wicket gir gayi sa." },
      { over: 0, ball: 5, event: 'double', runs: 2, isWicket: false, commentary: "Do ran ki daud! Tezi se bhaage dono batsman." },
      { over: 0, ball: 6, event: 'six', runs: 6, isWicket: false, commentary: "Sikkas! Aasman mein ball... tharo dhyan kidhar hai, ball boundary ke paar hai!" }
    ]
  },
  "RR_VS_GT": {
    teamA: "Rajasthan Royals",
    teamB: "Gujarat Titans",
    venue: "Sawai Mansingh Stadium, Jaipur",
    summary: "Royal challenge vs Titan power! Pink City is buzzing with Marwari energy.",
    overs: [
      { over: 0, ball: 1, event: 'dot', runs: 0, isWicket: false, commentary: "Khamma Ghani sa! Pehli ball aur khatarnak bouncer! Batsman ne jhuk kar izzat di." },
      { over: 0, ball: 2, event: 'four', runs: 4, isWicket: false, commentary: "Are baap re! Kaain baat hai bhaaya, gajab ko shot maaryo hai! Seedho boundary ke paar chauko!" },
      { over: 0, ball: 3, event: 'dot', runs: 0, isWicket: false, commentary: "Abke baali sunni gayi sa. Koni mile run, fielders ekdum mustail khadya hai." },
      { over: 0, ball: 4, event: 'six', runs: 6, isWicket: false, commentary: "Oh ho ho! Yo lyo! Ball seedhi taaran mein! Aasman se baataan kar rahi hai ball, gajab ko sikkas!" },
      { over: 0, ball: 5, event: 'single', runs: 1, isWicket: false, commentary: "Halke haath se khelya aur tezi se ek run chura liyo. Score aage badhyo sa." },
      { over: 0, ball: 6, event: 'wicket', runs: 0, isWicket: true, commentary: "Out! Phelio danda ukhaad diyo! Bowler ne kamaal kar diyo, batsman ghar jaavan taiyar!" }
    ]
  }
};

export async function generateCommentary(matchType: string = "fictional T20"): Promise<MatchNarration> {
  if (STATIC_MATCHES[matchType]) {
    return new Promise((resolve) => setTimeout(() => resolve(STATIC_MATCHES[matchType]), 500));
  }
  
  const prompt = `Generate a ${matchType} sequence for a cricket match (5 overs).
  The commentary MUST be heavily localized in authentic Marwari and Dhundhari / Rajasthani dialects, interspersed with Hindi/English cricket terms.
  It should feel like an enthusiastic local village commentator sitting in a 'Chaupal', using strong Rajasthani idioms and expressions.
  
  If it's an IPL match, mention specific IPL 2026 stars or scenarios but keep the Marwari flavor dominant.
  
  Use vibrant, heavy Marwari phrases like:
  - "Kaain baat hai bhaaya, gajab ko shot maaryo hai!"
  - "Are baap re, eyan koni chaale kaam!"
  - "Ball seedhi taaran mein!" (For a six)
  - "Out! Phelio danda ukhaad diyo!" 
  - "Khamma Ghani sa!", "Tharo dhyan kidhar hai bhaaya?"
  Make sure every ball's commentary includes at least 60-70% Marwari vocabulary, making it extremely authentic and humorous.
  
  Generate exactly 30 balls (5 overs).
  Include a variety of events: dots, 1s, 2s, 4s, 6s, and at least 2 wickets.
  
  Provide the response in JSON format according to the schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          teamA: { type: Type.STRING },
          teamB: { type: Type.STRING },
          venue: { type: Type.STRING },
          summary: { type: Type.STRING },
          overs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                over: { type: Type.INTEGER },
                ball: { type: Type.INTEGER },
                commentary: { type: Type.STRING },
                runs: { type: Type.INTEGER },
                isWicket: { type: Type.BOOLEAN },
                event: { 
                  type: Type.STRING,
                  enum: ['dot', 'single', 'double', 'three', 'four', 'six', 'wicket', 'wide', 'no-ball']
                }
              },
              required: ["over", "ball", "commentary", "runs", "isWicket", "event"]
            }
          }
        },
        required: ["teamA", "teamB", "venue", "overs", "summary"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
