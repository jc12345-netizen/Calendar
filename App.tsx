
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, ViewMode, GoogleConfig } from './types';
import CalendarView from './components/CalendarView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EventModal from './components/EventModal';
import GoogleConfigModal from './components/GoogleConfigModal';
import ExportModal from './components/ExportModal';
import { initializeGoogleApi, signInAndListEvents } from './services/googleCalendarService';
import { addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { LayoutGrid, BarChart3, Plus, Settings, FileDown } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'chronos_events';
const GOOGLE_CONFIG_KEY = 'chronos_google_config';

function App() {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date>(new Date());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // --- Effects ---
  
  // Load initial data
  useEffect(() => {
    // Local events
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

    // Google config
    const savedConfig = localStorage.getItem(GOOGLE_CONFIG_KEY);
    if (savedConfig) {
      try {
        setGoogleConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse google config", e);
      }
    }
  }, []);

  // Initialize Google API if config exists
  useEffect(() => {
    if (googleConfig) {
      initializeGoogleApi(googleConfig.clientId, googleConfig.apiKey)
        .then(() => setIsGoogleConnected(true))
        .catch(err => {
            console.error("Failed to init google api:", err);
            setIsGoogleConnected(false);
        });
    }
  }, [googleConfig]);

  // Fetch Google Events when connected and date changes (fetch for whole month)
  useEffect(() => {
    if (isGoogleConnected && googleConfig) {
      // Fetch 3 months range to be safe (prev, current, next)
      const start = subMonths(startOfMonth(currentDate), 1);
      const end = addMonths(endOfMonth(currentDate), 1);
      
      const calendarId = googleConfig.calendarId || 'primary';

      signInAndListEvents(start, end, calendarId)
        .then(fetchedEvents => {
            setGoogleEvents(fetchedEvents);
        })
        .catch(err => {
            console.error("Error fetching events", err);
            // If fetching fails with auth error, we might need to reset connection state
            // But usually signInAndListEvents handles auth prompt
        });
    }
  }, [isGoogleConnected, currentDate, googleConfig]);

  // Save local data on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const allEvents = useMemo(() => {
    return [...events, ...googleEvents];
  }, [events, googleEvents]);

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

  const handleSaveGoogleConfig = (config: GoogleConfig) => {
    setGoogleConfig(config);
    localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(config));
    // Effect will trigger initialization
  };

  const handleConnectGoogle = () => {
      // If we are NOT fully connected (initialized), open the modal to allow user to fix config or retry.
      if (!isGoogleConnected) {
          setIsGoogleModalOpen(true);
          return;
      }

      // If we are connected, try to sync
      if (googleConfig) {
           const start = subMonths(startOfMonth(currentDate), 1);
           const end = addMonths(endOfMonth(currentDate), 1);
           const calendarId = googleConfig.calendarId || 'primary';

           signInAndListEvents(start, end, calendarId)
            .then(fetchedEvents => setGoogleEvents(fetchedEvents))
            .catch(err => console.error(err));
      }
  }

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
         <div className="space-y-3">
            <button 
                onClick={handleConnectGoogle}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-xl transition-all border ${
                    isGoogleConnected 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title={isGoogleConnected ? "Connected" : "Click to configure"}
            >
                {isGoogleConnected ? (
                    <>
                        <div className="relative w-4 h-4">
                            <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        </div>
                        <span className="hidden lg:block text-xs font-medium">Synced</span>
                    </>
                ) : (
                    <>
                        <Settings size={18} />
                        <span className="hidden lg:block text-xs font-medium">Link Google</span>
                    </>
                )}
            </button>

            <button 
                onClick={() => setIsExportModalOpen(true)}
                className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-xl transition-all border bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            >
                <FileDown size={18} />
                <span className="hidden lg:block text-xs font-medium">Export</span>
            </button>

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
              events={allEvents}
              onDateChange={setCurrentDate}
              onAddEvent={openNewEventModal}
              onEventClick={openEditEventModal}
              onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
              onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
            />
          </div>
        ) : (
          <AnalyticsDashboard 
            events={allEvents}
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
      
      <GoogleConfigModal 
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSave={handleSaveGoogleConfig}
        initialConfig={googleConfig || undefined}
      />

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        events={allEvents}
      />
    </div>
  );
}

export default App;
