import React, { useState } from 'react';
import { CalendarEvent, EventCategory } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths
} from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Columns, Square } from 'lucide-react';
import { CATEGORY_COLORS } from '../constants';

interface CalendarViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  events,
  onDateChange,
  onEventClick,
  onAddEvent,
  onPrevMonth,
  onNextMonth
}) => {
  const [isMultiMonth, setIsMultiMonth] = useState(false);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to render a single month grid
  const renderMonthGrid = (monthDate: Date, showMonthTitle: boolean) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className={`flex flex-col h-full ${showMonthTitle ? 'border-r border-gray-200 last:border-r-0' : ''}`}>
        {showMonthTitle && (
            <div className="py-3 text-center font-bold text-gray-700 bg-gray-50/50 border-b border-gray-100">
                {format(monthDate, 'MMMM yyyy')}
            </div>
        )}

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {calendarDays.map((day) => {
            const dayEvents = events.filter(e => isSameDay(e.start, day));
            // Sort events by start time
            dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
            
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, currentDate);

            return (
              <div
                key={day.toString()}
                onClick={() => onDateChange(day)}
                className={`
                  min-h-[80px] lg:min-h-[100px] border-b border-r border-gray-100 p-2 flex flex-col gap-1 transition-colors relative group
                  ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                  ${isSelected ? 'bg-blue-50/30' : ''}
                  hover:bg-gray-50 cursor-pointer
                `}
              >
                {/* Day Number */}
                <div className="flex justify-between items-start">
                   <span className={`
                      text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
                      ${isDayToday 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                        : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                    `}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Add Button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEvent(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 text-blue-600 rounded-full transition-all"
                    title="Add Event"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Events List */}
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {dayEvents.slice(0, 4).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                         e.stopPropagation();
                         onEventClick(event);
                      }}
                      className={`
                        text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 flex items-center gap-1
                        ${event.isGoogleEvent 
                          ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                          : `${CATEGORY_COLORS[event.category]} text-white bg-opacity-90 hover:bg-opacity-100 shadow-sm`
                        }
                      `}
                      title={`${event.title} (${format(event.start, 'p')})`}
                    >
                      {event.isGoogleEvent && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>}
                      <span className="truncate">
                          {format(event.start, 'HH:mm')} {event.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 4 && (
                     <span className="text-[9px] sm:text-[10px] text-gray-400 pl-1">
                       +{dayEvents.length - 4} more
                     </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-100 flex-wrap gap-4">
        
        {/* Title (Only visible in single view here, moved to grid in multi view) */}
        {!isMultiMonth ? (
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
            {format(currentDate, 'MMMM yyyy')}
            </h2>
        ) : (
            <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Multi-Month View
            </div>
        )}

        <div className="flex items-center gap-3 ml-auto">
           {/* View Toggle */}
           <button 
             onClick={() => setIsMultiMonth(!isMultiMonth)}
             className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
             title={isMultiMonth ? "Switch to Single View" : "Switch to Multi View"}
           >
             {isMultiMonth ? <Square size={16} /> : <Columns size={16} />}
             <span className="hidden sm:inline">{isMultiMonth ? 'Single' : 'Multi'}</span>
           </button>

           <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

           {/* Navigation */}
           <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button onClick={onPrevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                    <ChevronLeft size={18} />
                </button>
                <button onClick={() => onDateChange(new Date())} className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition-all">
                    Today
                </button>
                <button onClick={onNextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                    <ChevronRight size={18} />
                </button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex overflow-hidden ${isMultiMonth ? 'flex-row' : 'flex-col'}`}>
         {/* Primary Month */}
         <div className="flex-1 overflow-hidden h-full">
            {renderMonthGrid(currentDate, isMultiMonth)}
         </div>

         {/* Secondary Month (Next Month) */}
         {isMultiMonth && (
            <div className="flex-1 overflow-hidden h-full hidden lg:block">
                {renderMonthGrid(addMonths(currentDate, 1), true)}
            </div>
         )}
      </div>
    </div>
  );
};

export default CalendarView;