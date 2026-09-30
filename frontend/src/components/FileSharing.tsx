import { useState, useEffect } from 'react';
import { File as FileIcon, Upload, Download, Loader2 } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';

interface SharedFile {
  _id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  uploadedAt: string;
  uploader: {
    _id: string;
    name: string;
    avatar: string;
  };
}

export default function FileSharing({ roomId, meetingId }: { roomId: string, meetingId: string }) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Fetch initial files
    api.get(`/files/meeting/${meetingId}`)
      .then(res => setFiles(res.data))
      .catch(console.error);

    socket.on('file-shared', (file: SharedFile) => {
      setFiles(prev => [file, ...prev]);
    });

    return () => {
      socket.off('file-shared');
    };
  }, [meetingId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('meetingId', meetingId);

    try {
      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFiles(prev => [data, ...prev]);
      socket.emit('file-shared', { roomId, file: data });
    } catch (error) {
      console.error('File upload failed', error);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full bg-navy-900">
      <div className="p-4 border-b border-white/5">
        <label className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg cursor-pointer transition-colors font-medium text-sm">
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>Upload File</span>
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-10">
            No files shared yet.
          </div>
        ) : (
          files.map(file => (
            <div key={file._id} className="bg-navy-800 p-3 rounded-xl border border-white/5">
              <div className="flex items-start gap-3">
                <div className="bg-navy-700 p-2 rounded-lg shrink-0">
                  <FileIcon className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatSize(file.fileSize)} • {file.uploader.name}
                  </p>
                </div>
                <a 
                  href={`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}/${file.storagePath.replace(/\\/g, '/')}`}
                  download={file.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-navy-700 hover:bg-navy-600 rounded-md text-gray-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
