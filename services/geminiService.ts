
import { GoogleGenAI, Type } from "@google/genai";
import { LoanRequest, AnalysisResult, LoanPurpose } from "../types";

export const analyzeDealWithAI = async (
  request: LoanRequest, 
  score: number, 
  band: string, 
  ltv: number,
  dscr: number,
  totalMonthlyPayment: number
): Promise<AnalysisResult> => {
 const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  
  const loanAmount = request.asIsValue * ltv;

  const prompt = `
    Persona: Senior Credit Underwriter.
    Tone: Professional, decisive, objective.
    
    Task: Analyze this DSCR loan request. 
    Use Google Search to:
    1. Check real estate market health for Zip Code ${request.zipCode}.
    2. Verify market rent benchmarks for ${request.assetType}.

    NARRATIVE GUIDELINES:
    - Do NOT recite the loan program rules or LTV matrices.
    - Focus on the STRENGTHS (e.g., high liquidity, strong rent-to-value, low leverage).
    - Focus on the RISKS (e.g., market volatility, tight DSCR).
    - Provide a qualitative summary of the DEAL itself.
    
    SPECIAL INSTRUCTION ON RENT RISK:
    - If the inputted rent ($${request.monthlyRent.toLocaleString()}) results in a very high DSCR (>1.50x) or seems high for the area, do NOT talk about "implied benchmarks". 
    - Instead, flag the specific risk: "The appraisal may return a lower market rent than inputted, which would reduce the DSCR and potentially cut the loan amount."
    - If you see potential issues, mention them as "Red Flags".

    DEAL DATA:
    - Loan Amt: $${loanAmount.toLocaleString()}
    - Asset: ${request.assetType}
    - Location: ${request.zipCode}, ${request.propertyState}
    - Purpose: ${request.loanPurpose}
    - Calculated DSCR: ${dscr.toFixed(2)}x
    - Reserve Position: $${request.liquidity.toLocaleString()}
    - STR Deal: ${request.isShortTermRental ? 'Yes' : 'No'}

    OUTPUT SCHEMA:
    {
      "narrativeSummary": "A 2-3 sentence overview of the deal's viability based on market and credit metrics.",
      "whatsWorking": ["Specific asset or borrower strengths"],
      "redFlags": ["Qualitative risks identified from market or data. Include 'Appraisal Rent Risk' if rents seem aggressive."],
      "deepDiveAreas": ["Items that need more scrutiny"],
      "improvementChecklist": ["Practical advice to strengthen the deal"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrativeSummary: { type: Type.STRING },
            whatsWorking: { type: Type.ARRAY, items: { type: Type.STRING } },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            deepDiveAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementChecklist: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["narrativeSummary", "whatsWorking", "redFlags", "deepDiveAreas", "improvementChecklist"]
        }
      }
    });

    const result = response.text ? JSON.parse(response.text) : getDefaultAnalysis();
    return {
      ...result,
      groundingSources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return getDefaultAnalysis();
  }
};

const getDefaultAnalysis = (): AnalysisResult => ({
  narrativeSummary: "Quantitative metrics are being reviewed against local market conditions.",
  whatsWorking: ["Asset type aligns with current portfolio targets"],
  redFlags: ["Valuation consistency must be verified"],
  deepDiveAreas: ["Local market vacancy rates"],
  improvementChecklist: ["Provide full entity documents"]
});
