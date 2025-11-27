import { CalendarEvent, EventCategory } from "../types";

const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Helper to wait for scripts to load
const waitForGlobal = (key: string, timeout = 5000) => {
  return new Promise<void>((resolve, reject) => {
    if ((window as any)[key]) return resolve();
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      if ((window as any)[key]) {
        clearInterval(interval);
        resolve();
      }
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for ${key} script to load`));
      }
    }, 100);
  });
};

export const initializeGoogleApi = async (clientId: string, apiKey: string): Promise<void> => {
  // Wait for scripts to be available on window
  try {
      await Promise.all([waitForGlobal('gapi'), waitForGlobal('google')]);
  } catch (e) {
      console.error("Google scripts not loaded:", e);
      throw e;
  }

  return new Promise((resolve, reject) => {
    // Load GAPI
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        checkInit(resolve);
      } catch (err) {
        reject(err);
      }
    });

    // Load GIS
    try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: '', // defined later in signInAndListEvents
        });
        gisInited = true;
        checkInit(resolve);
    } catch (err) {
        reject(err);
    }
  });
};

const checkInit = (resolve: () => void) => {
  if (gapiInited && gisInited) {
    resolve();
  }
};

export const signInAndListEvents = async (
    start: Date, 
    end: Date,
    calendarId: string = 'primary'
): Promise<CalendarEvent[]> => {
  if (!tokenClient || !gapiInited) {
      throw new Error("Google API not initialized. Please check your configuration.");
  }

  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      try {
        const events = await listUpcomingEvents(start, end, calendarId);
        resolve(events);
      } catch (err) {
        reject(err);
      }
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when there's no session token.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

const listUpcomingEvents = async (timeMin: Date, timeMax: Date, calendarId: string): Promise<CalendarEvent[]> => {
  try {
    const request = {
      'calendarId': calendarId,
      'timeMin': timeMin.toISOString(),
      'timeMax': timeMax.toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 250, // Increased limit
      'orderBy': 'startTime',
    };
    
    const response = await window.gapi.client.calendar.events.list(request);
    const events = response.result.items;
    
    if (!events || events.length === 0) {
      return [];
    }

    return events.map((event: any) => {
        // Handle full day events which have 'date' instead of 'dateTime'
        let start, end;
        if (event.start.dateTime) {
            start = new Date(event.start.dateTime);
            end = event.end.dateTime ? new Date(event.end.dateTime) : start;
        } else if (event.start.date) {
            // All-day event
            start = new Date(event.start.date);
            // Parse local timezone offset if needed, but usually Date(string) works for YYYY-MM-DD
            // Fix for end date being exclusive in Google Calendar
             end = event.end.date ? new Date(event.end.date) : start;
        } else {
            start = new Date();
            end = new Date();
        }

        // Simple heuristic to guess category based on keywords
        let category = EventCategory.MEETING;
        const lowerSummary = (event.summary || '').toLowerCase();
        
        if (lowerSummary.includes('lunch') || lowerSummary.includes('dinner') || lowerSummary.includes('party') || lowerSummary.includes('bday') || lowerSummary.includes('birthday')) {
            category = EventCategory.PERSONAL;
        } else if (lowerSummary.includes('doctor') || lowerSummary.includes('gym') || lowerSummary.includes('workout') || lowerSummary.includes('meditation')) {
            category = EventCategory.HEALTH;
        } else if (lowerSummary.includes('study') || lowerSummary.includes('course') || lowerSummary.includes('class') || lowerSummary.includes('learning')) {
            category = EventCategory.LEARNING;
        } else if (lowerSummary.includes('work') || lowerSummary.includes('standup') || lowerSummary.includes('sync')) {
            category = EventCategory.WORK;
        }

        return {
            id: event.id,
            title: event.summary || 'No Title',
            description: event.description,
            start: start,
            end: end,
            category: category,
            location: event.location,
            isGoogleEvent: true,
            googleId: event.id
        };
    });

  } catch (err) {
    console.error("Error fetching Google events", err);
    throw err;
  }
};
