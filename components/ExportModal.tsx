
import React from 'react';
import { X, FileDown, FileText } from 'lucide-react';
import { CalendarEvent } from '../types';
import { generateICS, generateCSV, downloadFile } from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, events }) => {
  if (!isOpen) return null;

  const handleExportICS = () => {
    const content = generateICS(events);
    downloadFile(content, 'chronos-calendar.ics', 'text/calendar');
    onClose();
  };

  const handleExportCSV = () => {
    const content = generateCSV(events);
    downloadFile(content, 'chronos-calendar.csv', 'text/csv');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            Export Calendar
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 mb-2">
            Choose a format to download your {events.length} events.
          </p>

          <button
            onClick={handleExportICS}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group text-left"
          >
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FileDown size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-800">iCalendar (.ics)</div>
              <div className="text-xs text-gray-500">Compatible with Google Calendar, Outlook, Apple Calendar</div>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all group text-left"
          >
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <FileText size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-800">CSV Spreadsheet</div>
              <div className="text-xs text-gray-500">Open in Excel, Google Sheets, or Numbers</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
