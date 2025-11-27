import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, ViewMode, GoogleConfig } from './types';
import CalendarView from './components/CalendarView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EventModal from './components/EventModal';
import GoogleConfigModal from './components/GoogleConfigModal';
import ExportModal from './components/ExportModal';
import { initializeGoogleApi, signInToGoogle, getGoogleEvents, signOutFromGoogle } from './services/googleCalendarService';
import { addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { LayoutGrid, BarChart3, Plus, Settings, FileDown, AlertTriangle, X, RefreshCw, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'chronos_events';
const GOOGLE_CONFIG_KEY = 'chronos_google_config';

function App() {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // Google State
  const [isApiReady, setIsApiReady] = useState(false); // Scripts loaded
  const [isAuthenticated, setIsAuthenticated] = useState(false); // User logged in
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
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
    if (googleConfig && !isApiReady) {
      initializeGoogleApi(googleConfig.clientId, googleConfig.apiKey)
        .then(() => setIsApiReady(true))
        .catch(err => {
            console.error("Failed to init google api:", err);
            setSyncError("Failed to initialize Google API. Please check your Client ID and API Key.");
        });
    }
  }, [googleConfig, isApiReady]);

  // Fetch Google Events whenever Date changes OR Authentication happens
  useEffect(() => {
    if (isApiReady && isAuthenticated && googleConfig) {
      fetchGoogleEvents();
    }
  }, [isAuthenticated, currentDate, isApiReady]);

  // Save local data on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const allEvents = useMemo(() => {
    return [...events, ...googleEvents];
  }, [events, googleEvents]);

  // --- Actions ---

  const fetchGoogleEvents = async () => {
    if (!googleConfig) return;
    setIsSyncing(true);
    setSyncError(null);

    const start = subMonths(startOfMonth(currentDate), 1);
    const end = addMonths(endOfMonth(currentDate), 1);
    const calendarId = googleConfig.calendarId || 'primary';

    try {
        const fetchedEvents = await getGoogleEvents(start, end, calendarId);
        setGoogleEvents(fetchedEvents);
    } catch (err: any) {
        console.error("Error fetching events", err);
        const msg = err.result?.error?.message || err.message || "Unknown error";
        
        if (msg.includes("Not Found") || (err.result?.error?.code === 404)) {
            setSyncError(`Calendar ID "${calendarId}" was not found. Please ensure you have added this calendar to your Google account or that the ID is correct.`);
        } else if (msg.includes("Login Required") || msg.includes("No access token")) {
            setIsAuthenticated(false); // Token invalid, need re-login
        } else {
            setSyncError(`Sync Error: ${msg}`);
        }
    } finally {
        setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
      if (!isApiReady) {
          setIsGoogleModalOpen(true);
          return;
      }

      setSyncError(null);
      setIsSyncing(true);

      try {
          await signInToGoogle();
          setIsAuthenticated(true);
          // fetchGoogleEvents will trigger via useEffect due to isAuthenticated change
      } catch (err: any) {
          console.error("Sign in failed", err);
          setIsSyncing(false);
          if (err.error === 'popup_blocked_by_browser') {
              setSyncError("Login popup was blocked. Please allow popups for this site.");
          } else {
              setSyncError("Google Sign-In failed. Please try again.");
          }
      }
  };

  const handleDisconnectGoogle = () => {
      signOutFromGoogle();
      setGoogleConfig(null);
      setGoogleEvents([]);
      setIsAuthenticated(false);
      localStorage.removeItem(GOOGLE_CONFIG_KEY);
      // We don't necessarily need to reset isApiReady unless we want to, 
      // but keeping scripts loaded is fine.
  };

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
    setIsApiReady(false); // Reset to force re-init
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
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 px-4 shrink-0 transition-all z-20">
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
            
            {/* Sync Button Logic */}
            {!googleConfig ? (
                <button 
                    onClick={() => setIsGoogleModalOpen(true)}
                    className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-xl transition-all border bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                    <Settings size={18} />
                    <span className="hidden lg:block text-xs font-medium">Setup Google</span>
                </button>
            ) : !isAuthenticated ? (
                <div className="flex gap-2">
                    <button 
                        onClick={handleManualSync}
                        disabled={!isApiReady || isSyncing}
                        className="flex-1 flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-xl transition-all border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                        {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        <span className="hidden lg:block text-xs font-medium">Sync Calendar</span>
                    </button>
                     <button 
                        onClick={() => setIsGoogleModalOpen(true)}
                        className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                     <button 
                        onClick={() => fetchGoogleEvents()}
                        className="flex-1 flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-xl transition-all border bg-green-50 border-green-200 text-green-700"
                        title="Click to refresh"
                    >
                        {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        <span className="hidden lg:block text-xs font-medium">Synced</span>
                    </button>
                    <button 
                        onClick={() => setIsGoogleModalOpen(true)}
                        className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            )}

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
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {syncError && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-start sm:items-center justify-between gap-4 text-sm text-red-700 animate-fade-in z-30">
             <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5 sm:mt-0" />
                <span>{syncError}</span>
             </div>
             <button onClick={() => setSyncError(null)} className="p-1 hover:bg-red-100 rounded-full transition-colors shrink-0">
                <X size={16} />
             </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative z-10">
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
        </div>
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
        onDisconnect={handleDisconnectGoogle}
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