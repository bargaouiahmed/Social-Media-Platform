import { useState } from "react";
import { djangoApi } from "../../api";

export default function Comment({parentId, postId, onCommentPosted, replyingTo}){
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setComment(e.target.value);
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        if (!comment.trim()) return; // Don't submit empty comments
        
        setSubmitting(true);
        try {
            const parent = parentId ? parentId : null; 
            const response = await djangoApi.comment(comment, postId, parent);
            setComment(""); // Clear the input field after successful submission
            
            // Notify parent component to refresh comments
            if (onCommentPosted) onCommentPosted();
        } catch(e) {
            console.log(e);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="w-full">
            {replyingTo && (
                <div className="text-xs text-blue-600 mb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Replying to <span className="font-medium ml-1">{replyingTo}</span>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex w-full rounded-md shadow-sm">
                <input 
                    className="px-4 py-2 flex-grow border-2 border-blue-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm transition-all duration-200" 
                    type="text" 
                    placeholder={parentId ? "Write your reply..." : "Share your thoughts..."}
                    onChange={handleChange}
                    value={comment}
                    disabled={submitting}
                />
                <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium transition-all duration-200 flex items-center"
                    disabled={submitting || !comment.trim()}
                >
                    {submitting ? (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>{parentId ? "Reply" : "Comment"}</>
                    )}
                </button>
            </form>
        </div>
    );
}