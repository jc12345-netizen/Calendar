import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventCategory } from '../types';
import { X, Clock, AlignLeft, Tag, MapPin, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
  editingEvent?: CalendarEvent | null;
}

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  initialDate,
  editingEvent 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>(EventCategory.WORK);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const isGoogle = editingEvent?.isGoogleEvent;

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title);
        setDescription(editingEvent.description || '');
        setCategory(editingEvent.category);
        setStartTime(toTimeInput(editingEvent.start));
        setEndTime(toTimeInput(editingEvent.end));
      } else {
        // Defaults for new event
        setTitle('');
        setDescription('');
        setCategory(EventCategory.WORK);
        const start = initialDate || new Date();
        start.setMinutes(0);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        setStartTime(toTimeInput(start));
        setEndTime(toTimeInput(end));
      }
    }
  }, [isOpen, editingEvent, initialDate]);

  const toTimeInput = (date: Date) => {
    // Returns YYYY-MM-DDTHH:mm format for datetime-local
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGoogle) return; // Cannot save google events
    if (!title || !startTime || !endTime) return;

    onSave({
      title,
      description,
      category,
      start: new Date(startTime),
      end: new Date(endTime),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            {isGoogle && (
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                 </svg>
            )}
            {editingEvent ? (isGoogle ? 'Event Details' : 'Edit Event') : 'New Event'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            {isGoogle ? (
              <div className="text-lg font-semibold text-gray-900">{title}</div>
            ) : (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g., Team Sync"
                autoFocus
              />
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Clock size={14} /> Start
              </label>
              {isGoogle ? (
                 <div className="text-gray-800">{format(editingEvent!.start, 'PP p')}</div>
              ) : (
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Clock size={14} /> End
              </label>
              {isGoogle ? (
                 <div className="text-gray-800">{format(editingEvent!.end, 'PP p')}</div>
              ) : (
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Tag size={14} /> Category
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(EventCategory).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  disabled={isGoogle}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600'
                  } ${!isGoogle && category !== cat ? 'hover:bg-gray-200' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

           {/* Location (Google Only) */}
           {isGoogle && editingEvent?.location && (
            <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <MapPin size={14} /> Location
                </label>
                <div className="text-gray-600 text-sm">{editingEvent.location}</div>
            </div>
           )}

          {/* Description */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <AlignLeft size={14} /> Description
            </label>
            {isGoogle ? (
               <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 min-h-[60px]">
                 {description || 'No description provided.'}
               </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-24"
                placeholder="Add details..."
              />
            )}
          </div>

          {isGoogle ? (
            <div className="pt-4 border-t border-gray-100 mt-4">
                 <button
                    type="button"
                    onClick={onClose}
                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                    Close
                </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                {editingEvent && onDelete && (
                <button
                    type="button"
                    onClick={() => {
                    if(confirm('Are you sure you want to delete this event?')) {
                        onDelete(editingEvent.id);
                        onClose();
                    }
                    }}
                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors"
                >
                    Delete
                </button>
                )}
                <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-lg shadow-blue-200"
                >
                {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EventModal;