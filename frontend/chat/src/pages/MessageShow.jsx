import React, { useState, useEffect, useRef } from "react";
import { socketClient, expressApi } from "../api";

export default function MessageShow({ message, onDelete }) {
  const userName = sessionStorage.getItem('username') || localStorage.getItem('username');
  const isCurrentUser = message.participant.user.username === userName;
  const [loadedAttachments, setLoadedAttachments] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const touchStarted = useRef(false);

  const deleteMessage = async (messageId) => {
    try {
      setIsDeleting(true);
      await expressApi.deleteMessage(messageId);
      onDelete(messageId);
    } catch (e) {
      console.log("Error deleting message:", e);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    const handleAttachmentComplete = (data) => {
      if (data.messageId === message.id) {
        setLoadedAttachments((prev) => ({
          ...prev,
          [data.filename]: true,
        }));

        // Find the attachment that was completed
        const completedAttachment = message.attachments?.find(
          att => att.filename === data.filename
        );

        // If it's a non-image file (video or document), reload the page
        if (completedAttachment &&
            completedAttachment.fileType &&
            !completedAttachment.fileType.startsWith('image/')) {
          console.log("Non-image upload completed, reloading page...");
          // Add a slight delay before reload to allow socket to complete
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }
    };

    socketClient.on("attachment_upload_complete", handleAttachmentComplete);

    return () => {
      socketClient.off("attachment_upload_complete", handleAttachmentComplete);
    };
  }, [message.id, message.attachments]);

  useEffect(() => {
    if (message.attachments?.length) {
      const initialLoadState = {};
      message.attachments.forEach((attachment) => {
        initialLoadState[attachment.filename] = false;
      });
      setLoadedAttachments(initialLoadState);
      const updatedState = { ...initialLoadState };
      message.attachments.forEach((attachment) => {
        updatedState[attachment.filename] = true;
      });
      setLoadedAttachments(updatedState);
    }
  }, [message.attachments]);

  const handleOptionsClick = (e) => {
    e.stopPropagation();
    // For touch devices, use dedicated state management
    if (e.type === "touchstart") {
      touchStarted.current = true;
      setShowDeleteConfirm(true);
    } else {
      // For mouse clicks, toggle normally
      setShowDeleteConfirm((prev) => !prev);
    }
  };

  const handleDocumentClick = (e) => {
    if (!e.target.closest(".delete-confirm") && !e.target.closest(".message-options")) {
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    if (showDeleteConfirm) {
      document.addEventListener("click", handleDocumentClick);
      document.addEventListener("touchstart", handleDocumentClick);
    }
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
    };
  }, [showDeleteConfirm]);

  const renderAttachment = (attachment) => {
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://backend_exp.bahwebdev.com/uploads/"
        : "http://localhost:5000/uploads/";
    const url = `${baseUrl}${attachment.filePath}`;
    const mimeType = attachment.fileType.split("/")[0];
    const isLoaded = loadedAttachments[attachment.filename];
    const mediaContainer = "relative mt-2 rounded-lg overflow-hidden bg-gray-800";
    const loadingContainer = "absolute inset-0 flex items-center justify-center bg-gray-800";

    if (!isLoaded) {
      return (
        <div className={`${mediaContainer} animate-pulse`} style={{ minWidth: "200px" }}>
          <div className={loadingContainer}>
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <span className="text-xs text-gray-400">Loading media...</span>
            </div>
          </div>
        </div>
      );
    }
    if (mimeType === "image") {
      return (
        <div className={`${mediaContainer} max-w-[280px]`}>
          <img
            src={url}
            alt={attachment.filename}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-image.png";
            }}
          />
        </div>
      );
    }
    if (mimeType === "video") {
      return (
        <div className={`${mediaContainer} max-w-[320px] aspect-video`}>
          <video controls className="w-full h-full object-contain" preload="metadata">
            <source src={url} type={attachment.fileType} />
          </video>
        </div>
      );
    }
    const fileSize = attachment.fileSize;
    const sizeDisplay =
      fileSize < 1024
        ? `${fileSize} B`
        : fileSize < 1024 * 1024
        ? `${(fileSize / 1024).toFixed(1)} KB`
        : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
    return (
      <a
        href={url}
        download={attachment.filename}
        className="flex items-center p-3 mt-2 space-x-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 w-5 h-5 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
          />
        </svg>
        <div className="min-w-0">
          <p className="text-sm truncate">{attachment.filename}</p>
          <p className="text-xs text-gray-400">{sizeDisplay}</p>
        </div>
      </a>
    );
  };

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-3 px-3 relative`}>
      <div
        className={`relative max-w-[85%] md:max-w-[75%] min-w-[120px] rounded-xl p-3 shadow-lg ${
          isCurrentUser ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gray-700"
        }`}
      >
        {isCurrentUser && (
          <button
            onTouchStart={handleOptionsClick}
            onClick={handleOptionsClick}
            className="message-options absolute right-0 top-0 p-1 z-10"
            aria-label="Message options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        )}
        {isCurrentUser && showDeleteConfirm && (
          <div className="delete-confirm absolute right-0 top-0 mt-6 mr-2 bg-gray-800 rounded-lg shadow-xl z-10 overflow-hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteMessage(message.id);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isDeleting}
              className="flex items-center w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-700 transition-colors"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete message
                </>
              )}
            </button>
          </div>
        )}
        {!isCurrentUser && (
          <div className="text-xs font-medium text-gray-300 mb-1.5">
            {message.participant.user.username}
          </div>
        )}
        {message.content && (
          <div className="text-sm leading-snug break-words">{message.content}</div>
        )}
        {message.attachments?.length > 0 && (
          <div className="mt-2.5 space-y-2.5">
            {message.attachments.map((attachment, index) => (
              <div key={index}>{renderAttachment(attachment)}</div>
            ))}
          </div>
        )}
        <div
          className={`text-xs mt-2 ${
            isCurrentUser ? "text-blue-100 opacity-70" : "text-gray-400"
          }`}
        >
          {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
