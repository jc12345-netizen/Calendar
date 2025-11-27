import React, { useState } from 'react';
import { X, ExternalLink, AlertCircle, Save } from 'lucide-react';
import { GoogleConfig } from '../types';

interface GoogleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: GoogleConfig) => void;
  initialConfig?: GoogleConfig;
}

const GoogleConfigModal: React.FC<GoogleConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialConfig 
}) => {
  const [clientId, setClientId] = useState(initialConfig?.clientId || '');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [calendarId, setCalendarId] = useState(initialConfig?.calendarId || 'primary');

  if (!isOpen) return null;

  const handleSave = () => {
    if (clientId && apiKey) {
      onSave({ clientId, apiKey, calendarId: calendarId || 'primary' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            Connect Google Calendar
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <div className="flex gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                To connect your calendar, you need a <strong>Client ID</strong> and <strong>API Key</strong> from the Google Cloud Console.
                <br />
                <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold underline mt-2 hover:text-blue-900"
                >
                  Open Google Cloud Console <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                placeholder="apps.googleusercontent.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                placeholder="AIzaSy..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calendar ID</label>
              <input
                type="text"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                placeholder="primary or your-email@gmail.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use <strong>primary</strong> for your main calendar, or enter a specific email (e.g., <em>jjboychuang@gmail.com</em>).
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!clientId || !apiKey}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl font-medium transition-colors shadow-lg shadow-blue-200"
          >
            <Save size={18} />
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleConfigModal;