import { GoogleGenAI, Type } from "@google/genai";
import { CalendarEvent, AnalyticsData, AnalyticsPeriod } from "../types";
import { format } from "date-fns";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSchedule = async (
  events: CalendarEvent[],
  period: AnalyticsPeriod,
  referenceDate: Date
): Promise<AnalyticsData> => {
  if (events.length === 0) {
    return {
      summary: "No events found for this period to analyze. Add some events to get started!",
      productivityScore: 0,
      moodEmoji: "😴",
      suggestions: ["Start by adding your first task or event."],
      categoryBreakdown: {}
    };
  }

  // Calculate generic stats locally to pass to LLM for context
  const totalDuration = events.reduce((acc, curr) => acc + (curr.end.getTime() - curr.start.getTime()), 0);
  const hours = totalDuration / (1000 * 60 * 60);
  
  const simplifiedEvents = events.map(e => ({
    title: e.title,
    category: e.category,
    durationHours: (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60),
    day: format(e.start, 'EEEE')
  }));

  const prompt = `
    You are a productivity expert AI. Analyze the following calendar events for a specific ${period}.
    Reference Date: ${format(referenceDate, 'yyyy-MM-dd')}
    Total Hours Logged: ${hours.toFixed(2)}
    
    Events Data:
    ${JSON.stringify(simplifiedEvents)}

    Please provide a structured analysis.
    - Summary: A brief, encouraging 2-3 sentence overview of how the time was spent.
    - Productivity Score: An integer from 0-100 based on balance and focus (Work/Learning/Health are positive, too many meetings might lower it slightly if excessive).
    - Mood Emoji: A single emoji representing the vibe of the schedule.
    - Suggestions: A list of 2-3 actionable tips to improve next time.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            productivityScore: { type: Type.INTEGER },
            moodEmoji: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "productivityScore", "moodEmoji", "suggestions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);

    // Calculate category breakdown locally for 100% accuracy on charts
    const categoryBreakdown: Record<string, number> = {};
    events.forEach(e => {
      const duration = (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60);
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + duration;
    });

    return {
      ...result,
      categoryBreakdown
    };

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    return {
      summary: "Unable to generate AI insights at the moment. Please check your connection or API key.",
      productivityScore: 0,
      moodEmoji: "⚠️",
      suggestions: ["Try again later."],
      categoryBreakdown: {}
    };
  }
};
