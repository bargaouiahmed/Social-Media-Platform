import { useState, useEffect } from "react";
import { djangoApi } from "../api";
import Reply from "./Reply";

// The CommentView component (now defined within the same file)
function CommentView({ comment, onReply }) {
    const [showReplies, setShowReplies] = useState(false);
    const formattedDate = new Date(comment.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center mb-2">
                <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3">
                    {comment.user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                    <h3 className="font-medium text-gray-800">{comment.user.username || 'Unknown'}</h3>
                    <p className="text-xs text-gray-500">{formattedDate}</p>
                </div>
            </div>
            <p className="text-gray-600 whitespace-pre-line mb-3">{comment.content}</p>

            <div className="flex space-x-4">
                <button
                    onClick={() => onReply(comment.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    Reply
                </button>

                {hasReplies && (
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                        {showReplies ? 'Hide replies' : `Show replies (${comment.replies.length})`}
                    </button>
                )}
            </div>

            {showReplies && hasReplies && (
                <div className="mt-4 pl-6 border-l-2 border-gray-200">
                    {comment.replies.map(reply => (
                        <CommentView
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PostCommentsModal({ postId, onClose }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [commentAdded, setCommentAdded]=useState(false)
    useEffect(() => {
        let isMounted = true;
        const fetchComments = async () => {
            try {
                const response = await djangoApi.getCommentsForPost(postId);
                if (isMounted) setComments(response.data);
            } catch (err) {
                if (isMounted) {
                    setError("Failed to load comments");
                    console.error("Error fetching comments:", err);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchComments();
        return () => { isMounted = false; };
    }, [postId]);
    useEffect(()=>{
        let isMounted = true;
        const fetchComments = async () => {
            try {
                const response = await djangoApi.getCommentsForPost(postId);
                if (isMounted) setComments(response.data);
            } catch (err) {
                if (isMounted) {
                    setError("Failed to load comments");
                    console.error("Error fetching comments:", err);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchComments();
        return () => { isMounted = false; };
        setCommentAdded(!commentAdded)
    },[commentAdded])
    const handleReplySuccess = () => {
        setReplyingTo(null);
        // Refresh comments
        setLoading(true);
        djangoApi.getCommentsForPost(postId)
            .then(response => setComments(response.data))
            .catch(err => {
                setError("Failed to refresh comments");
                console.error("Error refreshing comments:", err);
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Comments</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 p-4 bg-red-50 rounded-md">
                            {error}
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-gray-500 italic">No comments yet</p>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <CommentView
                                    key={comment.id}
                                    comment={comment}
                                    onReply={setReplyingTo}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reply Modal */}
            {replyingTo && (
                <Reply
                    post={postId}
                    onClose={() => {setReplyingTo(null); setCommentAdded(!commentAdded)}}
                    parent={replyingTo}
                    onReplySuccess={handleReplySuccess}
                />
            )}
        </div>
    );
}
