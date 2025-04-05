import { useState } from "react";

export default function CommentView({ comment, onReply }) {
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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
            <div className="p-6">
                <div className="flex items-center mb-4">
                    <div className="bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center mr-3">
                        {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">{comment.user.username}</h3>
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                    </div>
                </div>

                <div className="text-gray-600 mb-4">
                    {comment.content.split('\n').map((paragraph, i) => (
                        <p key={i} className="mb-2 overflow-hidden last:mb-0">
                            {paragraph}
                        </p>
                    ))}
                </div>

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
        </div>
    );
}
