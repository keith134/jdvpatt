import { GoogleGenAI } from "@google/genai";
import { AppData, AttendanceStatus, TOTAL_DAYS } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini client only if key exists, handled gracefully in hooks
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateMascotResponse = async (
  message: string,
  data: AppData
): Promise<string> => {
  if (!ai) {
    return "I need an API Key to see your data! Please check your environment configuration.";
  }

  // Summarize data to send to LLM to save tokens
  const studentSummary = data.students.map(s => {
    const record = data.attendance[s.id] || {};
    let present = 0;
    let absent = 0;
    let late = 0;
    
    for (let i = 1; i <= TOTAL_DAYS; i++) {
      const status = record[i];
      if (status === AttendanceStatus.PRESENT) present++;
      if (status === AttendanceStatus.ABSENT) absent++;
      if (status === AttendanceStatus.LATE) late++;
    }
    return `${s.name}: ${present} Present, ${absent} Absent, ${late} Late`;
  }).join('\n');

  const systemInstruction = `
    You are "Sparky", a cheerful and motivating robot assistant for the JDVP 40-Day Training Program.
    
    Your goal is to help the instructor manage attendance and analyze student performance.
    
    Here is the current class summary:
    ${studentSummary}
    
    Rules:
    1. Be concise, encouraging, and helpful.
    2. If asked about specific students, use the provided summary.
    3. Identify students at risk (high absences) if asked.
    4. Keep the tone professional but fun.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I couldn't think of a response right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Oop! My circuits are jammed. Please try again later.";
  }
};
