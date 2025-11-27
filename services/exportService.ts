
import { CalendarEvent } from '../types';
import { format } from 'date-fns';

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatICSDate = (date: Date): string => {
  return format(date, "yyyyMMdd'T'HHmmss");
};

const escapeICS = (str: string): string => {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
};

export const generateICS = (events: CalendarEvent[]): string => {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chronos Insight//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n');

  events.forEach(event => {
    icsContent += '\r\n' + [
      'BEGIN:VEVENT',
      `UID:${event.id}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(event.start)}`,
      `DTEND:${formatICSDate(event.end)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description || '')}`,
      `LOCATION:${escapeICS(event.location || '')}`,
      'END:VEVENT'
    ].join('\r\n');
  });

  icsContent += '\r\nEND:VCALENDAR';
  return icsContent;
};

const escapeCSV = (str: string): string => {
  if (!str) return '';
  const needsQuotes = str.includes(',') || str.includes('"') || str.includes('\n');
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const generateCSV = (events: CalendarEvent[]): string => {
  const headers = ['Subject', 'Start Date', 'Start Time', 'End Date', 'End Time', 'Description', 'Location', 'Category'];
  
  const rows = events.map(event => {
    return [
      escapeCSV(event.title),
      format(event.start, 'MM/dd/yyyy'),
      format(event.start, 'hh:mm a'),
      format(event.end, 'MM/dd/yyyy'),
      format(event.end, 'hh:mm a'),
      escapeCSV(event.description || ''),
      escapeCSV(event.location || ''),
      escapeCSV(event.category)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};
