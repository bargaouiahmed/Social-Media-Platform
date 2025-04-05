import { useEffect, useState } from "react";

export default function AttachmentViewer({ attachments, currentIndex, onClose, onNext, onPrev }) {
  const [touchStartX, setTouchStartX] = useState(0);

  // Replace localhost URL with production domain
  const getUrl = (url) => url.replace(
    'http://localhost:8000',
    'https://backend.bahwebdev.com'
  );

  // Get file type from URL extension
  const getFileType = (url) => {
    const ext = url.split('.').pop().split(/[#?]/)[0].toLowerCase();
    return {
      isImage: ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext),
      isVideo: ['mp4', 'mov', 'avi'].includes(ext),
      url: getUrl(url)
    };
  };

  // Touch handling for swipe gestures
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;

    if (deltaX > 50) onNext();    // Swipe left
    if (deltaX < -50) onPrev();   // Swipe right
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onClose]);

  const currentFile = getFileType(attachments[currentIndex].file_url);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50"
        aria-label="Close"
      >
        ×
      </button>

      {/* Navigation buttons */}
      {attachments.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 text-white hover:bg-black/70
                       min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 text-white hover:bg-black/70
                       min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Next"
          >
            →
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative max-w-full max-h-full p-4">
        {currentFile.isImage ? (
          <img
            src={currentFile.url}
            className="max-h-[90vh] max-w-full object-contain"
            alt="Attachment preview"
          />
        ) : currentFile.isVideo ? (
          <video
            controls
            className="max-h-[90vh] max-w-full"
            src={currentFile.url}
          />
        ) : (
          <a
            href={currentFile.url}
            className="text-blue-400 hover:underline p-4 block"
            download
            target="_blank"
            rel="noopener"
          >
            Download File
          </a>
        )}
      </div>
    </div>
  );
}
