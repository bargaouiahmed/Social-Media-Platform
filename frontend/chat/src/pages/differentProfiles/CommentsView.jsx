import { djangoApi } from "../../api";
import { useState, useEffect, useCallback, useRef } from "react";
import Comment from "./Comment";

export default function CommentsView({ postId }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [activeReplyId, setActiveReplyId] = useState(null); // Track which comment is being replied to
    const commentsRef = useRef([]);

    // Get current user ID from session storage
    const currentUserId = Number(sessionStorage.getItem('user_id')); // Convert to number for comparison

    const deleteComment = useCallback(async (commentId) => {
        try {
            await djangoApi.deletecomment(commentId);
            setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    }, []);
    
    // Enhanced recursive delete function to handle both comments and replies
    const handleDeleteComment = useCallback(async (commentId, isReply = false, parentId = null) => {
        try {
           const response =  await djangoApi.deleteComment(commentId);
           console.log("delete comment response", response);
            if (!isReply) {
                // If it's a top-level comment, remove it from the comments array
                setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
            } else if (parentId) {
                // If it's a reply, update the parent comment's replies
                setComments(prevComments => 
                    prevComments.map(comment => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                replies: comment.replies.filter(reply => reply.id !== commentId)
                            };
                        }
                        return comment;
                    })
                );
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    }, []);

    // Silently fetch comments and only apply changes
    const silentlyUpdateComments = useCallback(async () => {
        try {
            const response = await djangoApi.getCommentsForPost(postId);
            if (response.status !== 200) throw new Error("Failed to fetch comments");
            
            const newComments = response.data;
            commentsRef.current = newComments;
            setComments(newComments);
        } catch (error) {
            console.error("Error updating comments:", error);
        }
    }, [postId]);

    // Fetch comments when expanded
    const fetchComments = useCallback(async () => {
        if (!expanded) return;
        
        try {
            setLoading(true);
            const response = await djangoApi.getCommentsForPost(postId);
            if (response.status !== 200) throw new Error("Failed to fetch comments");
            
            const newComments = response.data;
            commentsRef.current = newComments;
            setComments(newComments);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    }, [postId, expanded]);

    // Toggle comments expansion
    const toggleComments = () => setExpanded(prev => !prev);

    // Start replying to a comment
    const handleReplyClick = (commentId) => {
        setActiveReplyId(commentId === activeReplyId ? null : commentId);
    };

    // Silent polling for new comments
    useEffect(() => {
        if (expanded) {
            fetchComments();
            const intervalId = setInterval(silentlyUpdateComments, 10000);
            return () => clearInterval(intervalId);
        }
    }, [expanded, fetchComments, silentlyUpdateComments]);

    // Handler for when a comment is posted
    const handleCommentPosted = useCallback(() => {
        // Clear the active reply ID after posting
        setActiveReplyId(null);
        
        // Silent update after a short delay
        setTimeout(silentlyUpdateComments, 500);
        
        // Auto-expand comments when a new comment is posted
        if (!expanded) setExpanded(true);
    }, [silentlyUpdateComments, expanded]);

    // Comment count
    const commentCount = comments.length + comments.reduce((count, comment) => 
        count + (comment.replies?.length || 0), 0);

    // Render a single comment or reply with its replies
    const renderComment = (comment, isReply = false, parentId = null) => {
        const isBeingRepliedTo = activeReplyId === comment.id;
        const isOwnComment = comment.user.id === currentUserId;
        
        return (
            <div 
                key={comment.id} 
                className={`comment-item mb-3 ${isBeingRepliedTo ? 'bg-blue-50 border-l-4 border-blue-500 pl-2 rounded' : ''}`}
            >
                <div className={`pb-2 ${!isReply ? 'border-b border-gray-200' : ''}`}>
                    {/* Comment header with user info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="font-medium text-blue-800">
                                {comment.user.first_name} {comment.user.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center space-x-2">
                            {/* Delete button - only show if user is the author */}
                            {isOwnComment && (
                                <button 
                                    onClick={() => handleDeleteComment(comment.id, isReply, parentId)}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    aria-label="Delete comment"
                                >
                                    Delete
                                </button>
                            )}
                            
                            {/* Reply button */}
                            <button 
                                onClick={() => handleReplyClick(comment.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {isBeingRepliedTo ? 'Cancel' : 'Reply'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Comment content */}
                    <div className="mt-1">
                        {comment.title && (
                            <h3 className="text-md font-semibold text-gray-900">
                                {comment.title}
                            </h3>
                        )}
                        <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                </div>
                
                {/* Reply form - only show under active reply */}
                {isBeingRepliedTo && (
                    <div className="mt-2 ml-3 bg-blue-50 p-2 rounded border border-blue-100">
                        <Comment 
                            parentId={comment.id} 
                            postId={postId} 
                            onCommentPosted={handleCommentPosted}
                            replyingTo={`${comment.user.first_name} ${comment.user.last_name}`}
                        />
                    </div>
                )}
                
                {/* Show replies if any */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-3 mt-2 space-y-2 pl-2 border-l-2 border-blue-100">
                        {comment.replies.map(reply => renderComment(reply, true, comment.id))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-2 bg-white rounded-lg shadow-sm border border-blue-100 p-3">
            {/* Comment toggle bar */}
            <div 
                className="flex items-center justify-between cursor-pointer py-2 border-b border-gray-200"
                onClick={toggleComments}
            >
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-700">
                        {commentCount > 0 ? 
                            `${commentCount} Comment${commentCount !== 1 ? 's' : ''}` : 
                            'Comments'}
                    </span>
                </div>
                <div className="text-sm text-blue-500 hover:text-blue-600">
                    {expanded ? 'Hide Comments' : 'View Comments'}
                </div>
            </div>

            {/* Main comment input */}
            <div className="mb-4 pt-2">
                <Comment 
                    postId={postId} 
                    parentId={null}
                    onCommentPosted={handleCommentPosted}
                />
            </div>

            {/* Collapsible comments section */}
            {expanded && (
                <div className="space-y-2 transition-all duration-300 ease-in-out max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-2 text-gray-500">Loading comments...</div>
                    ) : comments.length === 0 ? (
                        <div className="text-gray-500 italic text-center py-2">No comments yet</div>
                    ) : (
                        comments.map(comment => renderComment(comment))
                    )}
                </div>
            )}
        </div>
    );
}