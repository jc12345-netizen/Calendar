import { CalendarEvent, AnalyticsData, AnalyticsPeriod, EventCategory } from "../types";

export const analyzeSchedule = async (
  events: CalendarEvent[],
  period: AnalyticsPeriod,
  referenceDate: Date
): Promise<AnalyticsData> => {
  // Simulate a short delay to feel like "processing"
  await new Promise(resolve => setTimeout(resolve, 600));

  if (events.length === 0) {
    return {
      summary: "No events found for this period to analyze. Add some events to get started!",
      productivityScore: 0,
      moodEmoji: "😴",
      suggestions: ["Start by adding your first task or event."],
      categoryBreakdown: {}
    };
  }

  // Calculate stats locally
  const categoryBreakdown: Record<string, number> = {};
  let totalHours = 0;
  let workHours = 0;
  let healthHours = 0;
  let learningHours = 0;

  events.forEach(e => {
    const duration = (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60);
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + duration;
    totalHours += duration;

    if (e.category === EventCategory.WORK) workHours += duration;
    if (e.category === EventCategory.HEALTH) healthHours += duration;
    if (e.category === EventCategory.LEARNING) learningHours += duration;
  });

  // 1. Productivity Score Calculation (Heuristic)
  // Base score on percentage of "productive" categories (Work, Learning, Health)
  const productiveHours = workHours + healthHours + learningHours;
  let rawScore = totalHours > 0 ? (productiveHours / totalHours) * 100 : 0;
  
  // Bonus for having a mix of categories (balance)
  const categoriesCount = Object.keys(categoryBreakdown).length;
  if (categoriesCount > 2) rawScore += 10;
  if (categoriesCount > 4) rawScore += 5;

  const productivityScore = Math.min(100, Math.round(rawScore));

  // 2. Mood Emoji Determination
  let moodEmoji = "😐";
  if (productivityScore >= 80) moodEmoji = "🚀";
  else if (productivityScore >= 60) moodEmoji = "🙂";
  else if (totalHours > 12) moodEmoji = "😫"; // Burnout?
  else if (totalHours < 2) moodEmoji = "🏖️"; // Relaxing?
  else moodEmoji = "🤔";

  // 3. Summary Generation
  const topCategoryEntry = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];
  const topCategory = topCategoryEntry ? topCategoryEntry[0] : "Nothing";
  
  let summary = `You logged a total of ${totalHours.toFixed(1)} hours this ${period}. `;
  if (topCategory === EventCategory.WORK) {
    summary += "You had a very productive period with a strong focus on work.";
  } else if (topCategory === EventCategory.PERSONAL) {
    summary += "You spent a good amount of time on personal matters.";
  } else {
    summary += `Your main focus was ${topCategory}.`;
  }

  if (categoriesCount < 2 && totalHours > 4) {
    summary += " Consider diversifying your activities for better balance.";
  } else if (productivityScore > 80) {
    summary += " Great job maintaining high productivity!";
  }

  // 4. Suggestions Generation
  const allSuggestions = [
    "Ensure you take breaks between deep work sessions.",
    "Review your goals for the upcoming period.",
    "Stay hydrated throughout the day.",
    "Try to block out time for deep focus.",
    "Reflect on what tasks gave you the most energy.",
    "Plan your schedule the night before."
  ];

  if (healthHours === 0) allSuggestions.push("Try to squeeze in a quick workout or walk.");
  if (learningHours === 0) allSuggestions.push("Dedicate 15 mins to learning something new.");
  if (workHours > 8 && period === 'day') allSuggestions.push("You worked long hours; remember to disconnect.");
  if (Object.keys(categoryBreakdown).length === 1) allSuggestions.push("Your schedule is very uniform. Try adding variety.");

  // Shuffle and pick 3 unique suggestions
  const suggestions = allSuggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return {
    summary,
    productivityScore,
    moodEmoji,
    suggestions,
    categoryBreakdown
  };
};