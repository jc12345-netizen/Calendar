import React, { useEffect, useState, useMemo } from 'react';
import { CalendarEvent, AnalyticsData, AnalyticsPeriod, EventCategory } from '../types';
import { analyzeSchedule } from '../services/geminiService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CATEGORY_COLORS, CATEGORY_BG_COLORS_LIGHT } from '../constants';
import { Loader2, Sparkles, TrendingUp, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface AnalyticsDashboardProps {
  events: CalendarEvent[];
  currentDate: Date;
  onBack: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ events, currentDate, onBack }) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('day');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter events based on selected period (Day or Week)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (period === 'day') {
        return isSameDay(event.start, currentDate);
      } else {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        return isWithinInterval(event.start, { start, end });
      }
    });
  }, [events, currentDate, period]);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const result = await analyzeSchedule(filteredEvents, period, currentDate);
        if (isMounted) setData(result);
      } catch (error) {
        console.error("Failed to analyze", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalysis();
    return () => { isMounted = false; };
  }, [filteredEvents, period, currentDate]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.categoryBreakdown).map(([name, value]) => ({
      name,
      value: Number((value as number).toFixed(1))
    }));
  }, [data]);

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
             <ArrowLeft size={24} />
          </button>
          <div>
             <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-blue-600" />
                Analytics & Insights
             </h1>
             <p className="text-sm text-gray-500">
               {period === 'day' ? format(currentDate, 'EEEE, MMMM do, yyyy') : `Week of ${format(startOfWeek(currentDate), 'MMM do')} - ${format(endOfWeek(currentDate), 'MMM do')}`}
             </p>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPeriod('day')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              period === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
            <p className="animate-pulse">Consulting Gemini AI...</p>
          </div>
        ) : !data ? (
          <div className="text-center text-gray-500 mt-20">No data available.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            
            {/* Left Column: Stats & Charts */}
            <div className="space-y-6">
              
              {/* Score Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                   <h3 className="text-gray-500 font-medium mb-1">Productivity Score</h3>
                   <div className="text-4xl font-bold text-gray-800">{data.productivityScore}<span className="text-lg text-gray-400 font-normal">/100</span></div>
                </div>
                <div className="text-6xl select-none">{data.moodEmoji}</div>
              </div>

              {/* Chart Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-gray-800 font-semibold mb-6">Time Distribution</h3>
                <div className="h-64">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CATEGORY_COLORS[entry.name as EventCategory]?.replace('bg-', 'var(--tw-bg-opacity, 1) #') || '#8884d8'} 
                                className={CATEGORY_COLORS[entry.name as EventCategory]?.replace('bg-', 'fill-')}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value} hrs`, 'Duration']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 italic">
                        No events recorded
                      </div>
                    )}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {chartData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[d.name as EventCategory]}`} />
                        <span>{d.name}</span>
                        <span className="font-semibold">{d.value}h</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Column: AI Insights */}
            <div className="space-y-6">
              
              {/* Summary */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden">
                <Sparkles className="absolute top-4 right-4 text-blue-200" size={64} strokeWidth={1} />
                <h3 className="text-blue-900 font-semibold mb-3 flex items-center gap-2 relative z-10">
                  <Sparkles size={18} className="text-blue-600"/> Gemini Analysis
                </h3>
                <p className="text-blue-800 leading-relaxed relative z-10">
                  {data.summary}
                </p>
              </div>

              {/* Suggestions */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="text-gray-800 font-semibold mb-4">Suggestions for Improvement</h3>
                 <ul className="space-y-3">
                    {data.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex gap-3 items-start p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <span className="text-gray-600 text-sm leading-relaxed">{suggestion}</span>
                      </li>
                    ))}
                 </ul>
              </div>

              {/* Events List Mini-View */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-h-60 overflow-y-auto">
                <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon size={16} /> Filtered Events
                </h3>
                {filteredEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">No events in this period.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredEvents.map(event => (
                      <div key={event.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="truncate font-medium text-gray-700">{event.title}</div>
                        <div className={`px-2 py-0.5 rounded text-xs ${CATEGORY_BG_COLORS_LIGHT[event.category]}`}>
                           {event.category}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;