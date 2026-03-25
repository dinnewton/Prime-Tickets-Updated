import { useState, useRef } from 'react';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function ImageUpload({ value, onChange, className = '' }) {
  const { token } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/uploads/event-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      onChange(data.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={className}>
      {value ? (
        <div className="relative mt-2 h-48 rounded-xl overflow-hidden group">
          <img src={value} alt="Event" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-100"
            >
              <Upload className="w-3.5 h-3.5" /> Change
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          className="mt-2 h-48 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 transition-colors flex flex-col items-center justify-center text-gray-400 cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-500" />
              <p className="text-sm text-primary-500">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium">Click or drag & drop to upload</p>
              <p className="text-xs mt-1">JPEG, PNG, WebP — max 5 MB</p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
