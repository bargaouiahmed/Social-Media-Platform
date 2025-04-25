import { djangoApi } from "../../api";
import { useState, useEffect } from "react";
import Comment from "./Comment";
import CommentsView from "./CommentsView";
import ReactionBar from "../../components/ReactionBar";

export default function DProfilePostModal({ post }) {
  const [comments, setComments] = useState([]);
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [localPost, setLocalPost] = useState(post);

  const getCommentsForPost = async () => {
    try {
      const response = await djangoApi.getCommentsForPost(post.id);
      console.log("comments for post " + post.id, response);
      setComments(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getCommentsForPost();
  }, []);

  // Function to process attachment URLs
  const getAttachmentUrl = (url) => {
    if (!url) return "";

    // Replace localhost:8000 with production domain if needed
    if (process.env.NODE_ENV === "production") {
      return url.replace(
        "http://localhost:8000",
        "https://backend.bahwebdev.com"
      );
    }
    return url;
  };

  // Function to determine if attachment is an image
  const isImage = (fileUrl) => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const lowerUrl = fileUrl.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
  };

  // Process attachments for easier access
  const attachments = post.attachments.map((attachment) => {
    const fileUrl = getAttachmentUrl(attachment.file_url);
    const fileName = attachment.file.split("/").pop();
    const isImageFile = isImage(fileUrl);
    const isVideoFile = fileUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/i);

    return {
      ...attachment,
      fileUrl,
      fileName,
      isImageFile,
      isVideoFile,
    };
  });

  // Navigation functions
  const goToPreviousAttachment = () => {
    setActiveAttachmentIndex((prev) =>
      prev === 0 ? attachments.length - 1 : prev - 1
    );
  };

  const goToNextAttachment = () => {
    setActiveAttachmentIndex((prev) =>
      prev === attachments.length - 1 ? 0 : prev + 1
    );
  };

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX - touchEndX > 100) {
      // Swiped left, go next
      goToNextAttachment();
    } else if (touchEndX - touchStartX > 100) {
      // Swiped right, go previous
      goToPreviousAttachment();
    }
  };

  // Function to render media content
  const renderMediaContent = (attachment) => {
    if (attachment.isImageFile) {
      return (
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName}
          className="max-w-full max-h-[50vh] sm:max-h-[70vh] object-contain mx-auto rounded-md"
        />
      );
    } else if (attachment.isVideoFile) {
      return (
        <video
          controls
          className="max-w-full max-h-[50vh] sm:max-h-[70vh] mx-auto rounded-md"
        >
          <source
            src={attachment.fileUrl}
            type={`video/${attachment.fileUrl.split(".").pop()}`}
          />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">
            {attachment.fileName.endsWith(".pdf")
              ? "📄"
              : attachment.fileName.endsWith(".doc") ||
                attachment.fileName.endsWith(".docx")
              ? "📝"
              : attachment.fileName.endsWith(".zip") ||
                attachment.fileName.endsWith(".rar")
              ? "📦"
              : "📎"}
          </div>
          <p className="text-gray-700 mb-3 font-medium text-center text-sm sm:text-base">
            {attachment.fileName}
          </p>
          <a
            href={attachment.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors flex items-center space-x-1 text-sm sm:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>Download</span>
          </a>
        </div>
      );
    }
  };

  // Function to refresh the post data including reactions
  const refreshPost = async () => {
    try {
      // Fetch updated post data silently
      const response = await djangoApi.getPostById(post.id);
      if (response && response.data) {
        setLocalPost(response.data);
      }
    } catch (error) {
      console.error("Error refreshing post data:", error);
    }
  };

  // Handle reaction update - this gets called from ReactionBar
  const handleReactionUpdate = (reactionType, isAdding) => {
    // Create a deep copy of the current post
    const updatedPost = JSON.parse(JSON.stringify(localPost));
    
    // When adding a new reaction
    if (isAdding) {
      // First, handle removal of previous reaction if any
      if (updatedPost.user_reaction) {
        const oldReactionCount = updatedPost.reaction_counts.find(
          r => r.reaction === updatedPost.user_reaction
        );
        
        if (oldReactionCount) {
          // Decrease the count of previous reaction
          oldReactionCount.count = Math.max(0, oldReactionCount.count - 1);
          
          // If count becomes zero, remove this reaction type from the array
          if (oldReactionCount.count === 0) {
            updatedPost.reaction_counts = updatedPost.reaction_counts.filter(
              r => r.reaction !== updatedPost.user_reaction
            );
          }
        }
      }
      
      // Now handle adding the new reaction
      const newReactionCount = updatedPost.reaction_counts.find(
        r => r.reaction === reactionType
      );
      
      if (newReactionCount) {
        // Increment existing reaction count
        newReactionCount.count += 1;
      } else {
        // Add new reaction type
        updatedPost.reaction_counts.push({
          reaction: reactionType,
          count: 1
        });
      }
      
      // Update the user's reaction
      updatedPost.user_reaction = reactionType;
    } 
    // When removing a reaction (user clicked their current reaction)
    else {
      // Find the user's current reaction
      const currentReactionCount = updatedPost.reaction_counts.find(
        r => r.reaction === updatedPost.user_reaction
      );
      
      if (currentReactionCount) {
        // Decrease the count
        currentReactionCount.count = Math.max(0, currentReactionCount.count - 1);
        
        // If count becomes zero, remove this reaction type completely
        if (currentReactionCount.count === 0) {
          updatedPost.reaction_counts = updatedPost.reaction_counts.filter(
            r => r.reaction !== updatedPost.user_reaction
          );
        }
      }
      
      // Clear the user's reaction
      updatedPost.user_reaction = null;
    }
    
    // Update the local post state with our optimistic changes
    setLocalPost(updatedPost);
    
    // Also trigger a background refresh for accuracy
    setTimeout(refreshPost, 1000);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-hidden">
      {/* Post Header (Author Info & Timestamp) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="font-bold text-gray-800 text-sm sm:text-base">
          {localPost.author.first_name} {localPost.author.last_name}
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          {new Date(localPost.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Post Title */}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
        {localPost.title}
      </h2>

      {/* Post Content */}
      <p className="text-gray-700 text-sm sm:text-base break-words">
        {localPost.content}
      </p>

      {/* Facebook-style Attachment Viewer */}
      {attachments.length > 0 && (
        <div className="my-2 sm:my-4">
          {/* Main Media Viewer */}
          <div
            className="relative bg-black bg-opacity-5 rounded-lg overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Media Content */}
            <div className="flex justify-center items-center min-h-[150px] sm:min-h-[200px] py-4 sm:py-6">
              {renderMediaContent(attachments[activeAttachmentIndex])}
            </div>

            {/* Navigation Arrows */}
            {attachments.length > 1 && (
              <>
                <button
                  onClick={goToPreviousAttachment}
                  className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1.5 sm:p-2 shadow-md transition-all"
                  aria-label="Previous attachment"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-6 sm:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={goToNextAttachment}
                  className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1.5 sm:p-2 shadow-md transition-all"
                  aria-label="Next attachment"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-6 sm:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Attachment Counter */}
            {attachments.length > 1 && (
              <div className="absolute right-2 bottom-2 bg-black bg-opacity-60 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {activeAttachmentIndex + 1} / {attachments.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip (shows when there are multiple attachments) */}
          {attachments.length > 1 && (
            <div className="mt-2 flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-2 no-scrollbar">
              {attachments.map((attachment, index) => (
                <div
                  key={attachment.id}
                  onClick={() => setActiveAttachmentIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 border-2 rounded cursor-pointer overflow-hidden 
                    ${
                      index === activeAttachmentIndex
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                >
                  {attachment.isImageFile ? (
                    <img
                      src={attachment.fileUrl}
                      alt={`Thumbnail ${index}`}
                      className="w-full h-full object-cover"
                    />
                  ) : attachment.isVideoFile ? (
                    <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Caption/Filename */}
          <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 text-center truncate">
            {attachments[activeAttachmentIndex].fileName}
          </div>
        </div>
      )}

      {/* Reaction Summary - Compact display of current reactions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1 pb-1">
        {localPost.reaction_counts && localPost.reaction_counts.length > 0 ? (
          <>
            <div className="flex items-center space-x-1">
              <div className="flex">
                {localPost.reaction_counts.map((reaction) => (
                  <span
                    key={reaction.reaction}
                    className="text-lg leading-none -ml-1 first:ml-0"
                    title={`${reaction.count} ${reaction.reaction}`}
                  >
                    {reaction.reaction === "like"
                      ? "👍"
                      : reaction.reaction === "love"
                      ? "❤️"
                      : reaction.reaction === "dislike"
                      ? "👎"
                      : "😠"}
                  </span>
                ))}
              </div>
              <span className="text-xs sm:text-sm text-gray-600 ml-1">
                {localPost.reaction_counts.reduce(
                  (sum, item) => sum + item.count,
                  0
                )}
              </span>
            </div>

            {localPost.user_reaction && (
              <div className="text-xs sm:text-sm text-gray-500 italic ml-auto">
                You reacted with{" "}
                {localPost.user_reaction === "like"
                  ? "👍"
                  : localPost.user_reaction === "love"
                  ? "❤️"
                  : localPost.user_reaction === "dislike"
                  ? "👎"
                  : "😠"}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs sm:text-sm text-gray-500">
            No reactions yet
          </span>
        )}
      </div>

      {/* Interactive ReactionBar */}
      <ReactionBar 
        postId={localPost.id} 
        refresh={refreshPost} 
        onReactionUpdate={handleReactionUpdate}
        currentReaction={localPost.user_reaction}
      />

      {/* Comment section layout */}
      <div className="flex flex-col space-y-3 sm:space-y-4 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
        <div className="flex-grow overflow-y-auto">
          <CommentsView postId={post.id} />
        </div>
      </div>
    </div>
  );
}