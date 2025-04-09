import { useState, useRef, useEffect } from "react";
import { socketClient, expressApi } from "../api";
import { v4 as uuidv4 } from 'uuid';

export default function SendMessage({ conversationId }) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploadJobs, setUploadJobs] = useState([]);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Socket listener for attachment completion
  useEffect(() => {
    const handleAttachmentComplete = (data) => {
      setUploadJobs(prevJobs =>
        prevJobs.map(job => {
          if (job.messageId === data.messageId) {
            const newProgress = {
              ...job.progress,
              [data.filename]: 100
            };

            const allComplete = Object.values(newProgress).every(p => p >= 100);

            // If all files are complete, set a timeout to remove the job
            if (allComplete) {
              setTimeout(() => {
                setUploadJobs(prev => prev.filter(j => j.messageId !== data.messageId));
              }, 2000); // Remove after 2 seconds
            }

            return {
              ...job,
              progress: newProgress,
              status: allComplete ? 'completed' : 'uploading'
            };
          }
          return job;
        })
      );
    };

    socketClient.on("attachment_upload_complete", handleAttachmentComplete);
    return () => {
      socketClient.off("attachment_upload_complete", handleAttachmentComplete);
    };
  }, []);

  const createMessageJob = async (job) => {
    try {
      const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');

      // Handle small files via WebSocket
      if (job.attachments.length === 0 || job.attachments.every(file =>
        file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
      )) {
        const socketFiles = await Promise.all(
          job.attachments.map(async (file) => ({
            filename: file.name,
            type: file.type,
            size: file.size,
            data: await readFileAsBase64(file)
          }))
        );

        socketClient.emit("new_message", {
          content: job.content,
          conversationId,
          userId,
          files: socketFiles
        });

        // For text messages or small files, show success message briefly then remove
        setTimeout(() => {
          setUploadJobs(prevJobs => prevJobs.filter(j => j.id !== job.id));
        }, 2000);
      }
      // Handle large files via HTTP
      else {
        let messageId;

        // Create message shell
        await new Promise(resolve => {
          socketClient.emit("new_message", {
            content: job.content || "Sending attachment...",
            conversationId,
            userId
          });

          const handler = (data) => {
            if (data?.id) {
              messageId = data.id;
              socketClient.off("receive_message", handler);
              resolve();
            }
          };
          socketClient.on("receive_message", handler);
        });

        // Update job with message ID
        setUploadJobs(prevJobs => prevJobs.map(j =>
          j.id === job.id ? {
            ...j,
            messageId,
            status: 'uploading',
            progress: job.attachments.reduce((acc, file) => ({
              ...acc,
              [file.name]: 0
            }), {})
          } : j
        ));

        // Upload files
        for (const file of job.attachments) {
          await expressApi.uploadFileWithProgress(
            file,
            conversationId,
            messageId,
            (progress) => {
              setUploadJobs(prevJobs =>
                prevJobs.map(j => j.id === job.id ? {
                  ...j,
                  progress: { ...j.progress, [file.name]: progress }
                } : j)
              );
            }
          );

          socketClient.emit("attachment_uploaded", {
            messageId,
            filename: file.name,
            conversationId
          });
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadJobs(prevJobs => prevJobs.map(j =>
        j.id === job.id ? { ...j, status: 'failed' } : j
      ));

      // Remove failed jobs after 5 seconds
      setTimeout(() => {
        setUploadJobs(prevJobs => prevJobs.filter(j => j.id !== job.id));
      }, 5000);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() === "" && attachments.length === 0) return;

    const newJob = {
      id: uuidv4(),
      content: message,
      attachments: [...attachments],
      progress: {},
      status: 'sending',
      messageId: null
    };

    setUploadJobs(prev => [...prev, newJob]);
    setMessage("");
    setAttachments([]);

    // Start async processing
    createMessageJob(newJob);
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAttachFiles = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Enhanced handler for paste events
  const handlePaste = (e) => {
    const clipboardItems = e.clipboardData.items;
    const pastedFiles = [];
    let hasProcessedFile = false;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];

      // Check if the pasted content is a file
      if (item.kind === 'file') {
        const blob = item.getAsFile();
        if (!blob) continue;

        hasProcessedFile = true;

        // Create a filename with timestamp to prevent duplicates
        // Try to determine a reasonable extension
        let extension = 'bin'; // Default for unknown types
        const mimeType = blob.type;

        // Try to use original filename if available
        if (blob.name) {
          extension = blob.name.split('.').pop();
        } else {
          // Map common MIME types to extensions
          const mimeToExt = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'application/pdf': 'pdf',
            'text/plain': 'txt',
            'text/html': 'html',
            'text/css': 'css',
            'text/javascript': 'js',
            'application/json': 'json',
            'application/xml': 'xml',
            'application/zip': 'zip',
            'application/x-tar': 'tar',
            'video/mp4': 'mp4',
            'video/quicktime': 'mov',
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
          };

          extension = mimeToExt[mimeType] || extension;
        }

        // Create filename with timestamp
        const filename = `pasted-file-${Date.now()}.${extension}`;

        // Create a new File object with a proper name
        const file = new File([blob], filename, { type: blob.type });

        pastedFiles.push(file);
      }
    }

    // If files were pasted, add them to attachments
    if (pastedFiles.length > 0) {
      if (hasProcessedFile) {
        e.preventDefault(); // Prevent default paste behavior only if we processed files
      }
      setAttachments(prev => [...prev, ...pastedFiles]);
    }
    // Text content will be handled by the textarea's default behavior
  };

  // Helper function to get file icon based on file type
  const getFileIcon = (file) => {
    const mimeType = file.type;

    if (mimeType.startsWith('image/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimeType.startsWith('video/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimeType.startsWith('audio/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    } else if (mimeType === 'application/pdf') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (mimeType.startsWith('text/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (mimeType.includes('zip') || mimeType.includes('compressed')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  // Get file extension for display
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  // Get truncated file name for display
  const getTruncatedFileName = (filename, maxLength = 10) => {
    const name = filename.split('.')[0];
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Format file size for readable display
  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${Math.round(sizeInBytes / 1024)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col space-y-2 w-full max-w-full">
      {/* Upload status indicators - will auto-disappear after completion */}
      {uploadJobs.map(job => (
        <div
          key={job.id}
          className="p-2 bg-gray-800 rounded-lg text-sm transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs sm:text-sm">
              {job.status === 'sending' && 'Sending message...'}
              {job.status === 'uploading' && 'Uploading attachments...'}
              {job.status === 'completed' && '✓ Delivered'}
              {job.status === 'failed' && '⚠ Failed to send'}
            </span>
            {job.status !== 'completed' && job.status !== 'failed' && (
              <button
                className="text-red-400 hover:text-red-300 text-xs"
                onClick={() => setUploadJobs(prev => prev.filter(j => j.id !== job.id))}
                aria-label="Cancel upload"
              >
                Cancel
              </button>
            )}
          </div>

          {Object.keys(job.progress).length > 0 && (
            <div className="mt-2 space-y-1">
              {job.attachments.map((file, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-xs text-gray-400 truncate">
                    {getTruncatedFileName(file.name, 20)}.{getFileExtension(file.name).toLowerCase()} ({formatFileSize(file.size)})
                  </div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${job.progress[file.name] || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Attachment previews - now more responsive */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-800 rounded-t-lg">
          {attachments.map((file, index) => (
            <div key={index} className="relative">
              {file.type.startsWith('image/') ? (
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs truncate px-1">
                    {getFileExtension(file.name)}
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs"
                    aria-label="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gray-700 rounded flex flex-col items-center justify-center p-1">
                  <div className="text-gray-300">
                    {getFileIcon(file)}
                  </div>
                  <span className="text-xs text-center text-gray-300 mt-1 truncate w-full">
                    {getFileExtension(file.name)}
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs"
                    aria-label="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs truncate px-1 rounded-b">
                {formatFileSize(file.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input area - improved for mobile */}
      <div className={`flex items-end space-x-1 sm:space-x-2 p-1 sm:p-2 bg-gray-800 rounded-lg ${attachments.length > 0 ? 'rounded-t-none' : ''}`}>
        <button
          onClick={handleAttachFiles}
          className="text-gray-400 hover:text-white p-1 sm:p-2 flex-shrink-0"
          title="Attach files"
          aria-label="Attach files"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          aria-label="File input"
        />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            className="w-full rounded-lg py-2 px-3 bg-gray-700 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[120px]"
            placeholder="Type a message or paste files..."
            rows="1"
            style={{ overflowY: 'auto' }}
            aria-label="Message content"
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!message.trim() && attachments.length === 0}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
