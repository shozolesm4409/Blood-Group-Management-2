
import { GoogleGenAI } from "@google/genai";
import { DonationRecord } from "../types";

export const generateDonationInsight = async (donations: DonationRecord[]): Promise<string> => {
  // Always use a named parameter for apiKey and obtain it exclusively from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalVolume = donations.reduce((acc, curr) => acc + curr.units, 0);
  const byGroup = donations.reduce((acc, curr) => {
    acc[curr.userBloodGroup] = (acc[curr.userBloodGroup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = `
    Total Donations: ${donations.length}
    Total Volume: ${totalVolume}ml
    Breakdown by Group: ${JSON.stringify(byGroup)}
    Date: ${new Date().toLocaleDateString()}
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning tasks like data analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a medical data analyst. Analyze this blood bank data and provide 3 short, actionable bullet points about current stock levels and donor engagement.
      
      Data:
      ${summary}`,
    });

    // Access the .text property directly (not as a method)
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI insights at this time.";
  }
};
