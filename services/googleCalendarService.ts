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

export const initializeGoogleApi = async (clientId: string, apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Load GAPI
    if (window.gapi) {
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
    } else {
        reject("Google API script not loaded");
    }

    // Load GIS
    if (window.google) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: '', // defined later
        });
        gisInited = true;
        checkInit(resolve);
    } else {
        reject("Google Identity Services script not loaded");
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
      'maxResults': 100,
      'orderBy': 'startTime',
    };
    
    const response = await window.gapi.client.calendar.events.list(request);
    const events = response.result.items;
    
    if (!events || events.length === 0) {
      return [];
    }

    return events.map((event: any) => {
        // Handle full day events which have 'date' instead of 'dateTime'
        const start = event.start.dateTime 
            ? new Date(event.start.dateTime) 
            : new Date(event.start.date); // Midnight local time usually
        
        const end = event.end.dateTime 
            ? new Date(event.end.dateTime) 
            : new Date(event.end.date);

        // Simple heuristic to guess category based on keywords, otherwise default to Meeting
        let category = EventCategory.MEETING;
        const lowerSummary = (event.summary || '').toLowerCase();
        
        if (lowerSummary.includes('lunch') || lowerSummary.includes('dinner') || lowerSummary.includes('party')) {
            category = EventCategory.PERSONAL;
        } else if (lowerSummary.includes('doctor') || lowerSummary.includes('gym') || lowerSummary.includes('workout')) {
            category = EventCategory.HEALTH;
        } else if (lowerSummary.includes('study') || lowerSummary.includes('course') || lowerSummary.includes('learn')) {
            category = EventCategory.LEARNING;
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