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
            callback: '', // defined dynamically in signInToGoogle
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

/**
 * Triggers the Google Sign-In Popup.
 * MUST be called from a user event handler (e.g. button click) to avoid popup blockers.
 */
export const signInToGoogle = (): Promise<void> => {
  if (!tokenClient || !gapiInited) {
      return Promise.reject(new Error("Google API not initialized."));
  }

  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        reject(resp);
      } else {
        resolve(); // Token is now stored in gapi client internally
      }
    };

    // Always use consent prompt for the first time to ensure we get a fresh token
    // In a production app, you might check if a token exists, but 'prompt: ""' 
    // can still trigger popups which we want to control.
    tokenClient.requestAccessToken({ prompt: '' });
  });
};

export const signOutFromGoogle = (): void => {
    try {
        const token = window.gapi?.client?.getToken()?.access_token;
        if (token && window.google?.accounts?.oauth2) {
            window.google.accounts.oauth2.revoke(token, () => {
                console.log("Token revoked");
            });
        }
        if (window.gapi?.client) {
            window.gapi.client.setToken(null);
        }
    } catch (e) {
        console.error("Error signing out", e);
    }
};

/**
 * Fetches events using the existing session.
 */
export const getGoogleEvents = async (
    start: Date, 
    end: Date, 
    calendarId: string
): Promise<CalendarEvent[]> => {
    // Check if we have a token (rough check)
    if (!window.gapi.client.getToken()) {
        throw new Error("No access token. Please sign in.");
    }

    try {
        const request = {
            'calendarId': calendarId,
            'timeMin': timeMinToISO(start),
            'timeMax': timeMinToISO(end),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 250,
            'orderBy': 'startTime',
        };
        
        const response = await window.gapi.client.calendar.events.list(request);
        const events = response.result.items;
        
        if (!events || events.length === 0) {
            return [];
        }

        return events.map((event: any) => parseGoogleEvent(event));

    } catch (err: any) {
        console.error("Error fetching Google events", err);
        throw err;
    }
};

// Helper to ensure dates are ISO strings
const timeMinToISO = (date: Date) => {
    return date.toISOString();
};

const parseGoogleEvent = (event: any): CalendarEvent => {
    let start: Date, end: Date;

    if (event.start.dateTime) {
        // Timed event
        start = new Date(event.start.dateTime);
        end = event.end.dateTime ? new Date(event.end.dateTime) : start;
    } else if (event.start.date) {
        // All-day event
        // Note: Google all-day end date is exclusive, but for display we usually treat it simply
        // We parse the YYYY-MM-DD string as local time to avoid timezone shifts
        const parts = event.start.date.split('-');
        start = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        
        const endParts = event.end.date ? event.end.date.split('-') : parts;
        end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
    } else {
        start = new Date();
        end = new Date();
    }

    // Heuristic for category
    let category = EventCategory.MEETING;
    const lowerSummary = (event.summary || '').toLowerCase();
    
    if (lowerSummary.includes('lunch') || lowerSummary.includes('dinner') || lowerSummary.includes('party') || lowerSummary.includes('bday') || lowerSummary.match(/birthday/)) category = EventCategory.PERSONAL;
    else if (lowerSummary.match(/doctor|gym|workout|meditation|dentist/)) category = EventCategory.HEALTH;
    else if (lowerSummary.match(/study|course|class|learning|tutorial/)) category = EventCategory.LEARNING;
    else if (lowerSummary.match(/work|standup|sync|meeting|dev|code/)) category = EventCategory.WORK;

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
};