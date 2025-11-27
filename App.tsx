import React, { useState, useEffect } from 'react';
import { CalendarEvent, ViewMode } from './types';
import CalendarView from './components/CalendarView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EventModal from './components/EventModal';
import { addMonths, subMonths } from 'date-fns';
import { LayoutGrid, BarChart3, Plus } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'chronos_events';

function App() {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date>(new Date());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // --- Effects ---
  
  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert ISO strings back to Date objects
        const hydrated = parsed.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end)
        }));
        setEvents(hydrated);
      } catch (e) {
        console.error("Failed to parse events", e);
      }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  // --- Handlers ---

  const handleAddEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      // Edit mode
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : e));
    } else {
      // Create mode
      const newEvent: CalendarEvent = {
        ...eventData,
        id: crypto.randomUUID(),
      };
      setEvents(prev => [...prev, newEvent]);
    }
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const openNewEventModal = (date?: Date) => {
    setEditingEvent(null);
    setModalDate(date || new Date());
    setIsModalOpen(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  // --- Render ---

  return (
    <div className="h-screen w-screen flex bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* Sidebar / Navigation */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 px-4 shrink-0 transition-all">
         <div className="space-y-8">
            <div className="flex items-center gap-3 justify-center lg:justify-start">
               <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                 <LayoutGrid className="text-white" size={24} />
               </div>
               <span className="text-xl font-bold tracking-tight hidden lg:block text-gray-800">Chronos</span>
            </div>

            <nav className="space-y-2">
               <button 
                onClick={() => setViewMode('calendar')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  viewMode === 'calendar' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-100'
                }`}
               >
                 <LayoutGrid size={22} />
                 <span className="hidden lg:block">Calendar</span>
               </button>
               <button 
                onClick={() => setViewMode('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  viewMode === 'analytics' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-100'
                }`}
               >
                 <BarChart3 size={22} />
                 <span className="hidden lg:block">Insights</span>
               </button>
            </nav>
         </div>

         {/* Bottom Action */}
         <div className="space-y-4">
            <button 
              onClick={() => openNewEventModal(currentDate)}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-xl transition-all shadow-lg shadow-gray-200 active:scale-95"
            >
              <Plus size={24} />
              <span className="hidden lg:block font-medium">Add Event</span>
            </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative">
        {viewMode === 'calendar' ? (
          <div className="h-full p-4 lg:p-8">
            <CalendarView 
              currentDate={currentDate}
              events={events}
              onDateChange={setCurrentDate}
              onAddEvent={openNewEventModal}
              onEventClick={openEditEventModal}
              onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
              onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
            />
          </div>
        ) : (
          <AnalyticsDashboard 
            events={events}
            currentDate={currentDate}
            onBack={() => setViewMode('calendar')}
          />
        )}
      </main>

      {/* Modals */}
      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddEvent}
        onDelete={handleDeleteEvent}
        initialDate={modalDate}
        editingEvent={editingEvent}
      />
    </div>
  );
}

export default App;