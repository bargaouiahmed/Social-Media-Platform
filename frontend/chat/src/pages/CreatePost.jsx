import { useState, useRef } from "react";
import { djangoApi } from "../api";

export default function CreatePost({ onClose, onPostCreated }) {
    const [postData, setPostData] = useState({
        title: "",
        content: ""
    });
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handlePostChange = (e) => {
        setPostData({
            ...postData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setAttachments(Array.from(e.target.files || []));
    };

  // In CreatePost.jsx - update the handleSubmit function
const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if already submitting to prevent double submissions
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
        const formData = new FormData();
        formData.append('title', postData.title);
        formData.append('content', postData.content);

        // Clear any existing file inputs from the FormData
        // (This shouldn't be necessary but helps prevent duplicates)

        // Add files one by one with distinct index in the name
        attachments.forEach((file, index) => {
            formData.append(`attachments`, file); // Keep the name consistent
        });

        // For debugging - check what's actually in the FormData
        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
            console.log(key, value instanceof File ? value.name : value);
        }

        const createdPost = await djangoApi.makePost(formData);
        onPostCreated?.(createdPost);
        onClose();
    } catch (err) {
        setError(
            err.response?.data?.attachments?.[0] ||
            err.response?.data?.message ||
            "Failed to create post"
        );
        console.error("Post creation error:", err.response?.data || err.message);
    } finally {
        setIsSubmitting(false);
    }
};

    const clearFiles = () => {
        setAttachments([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
                {/* Title field */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Title*</label>
                    <input
                        type="text"
                        name="title"
                        value={postData.title}
                        onChange={handlePostChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Post title"
                        required
                        minLength="3"
                    />
                </div>

                {/* Content field */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">Content*</label>
                    <textarea
                        name="content"
                        value={postData.content}
                        onChange={handlePostChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                        placeholder="What's on your mind?"
                        required
                        minLength="10"
                    />
                </div>

                {/* Attachments field */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">
                        Attachments
                        <span className="text-sm text-gray-500 ml-1">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            className="hidden"
                            id="post-attachments"
                            name="attachments"  // Important: matches backend expectation
                        />
                        <label
                            htmlFor="post-attachments"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-center"
                        >
                            {attachments.length > 0
                                ? `${attachments.length} file(s) selected`
                                : "Select files..."}
                        </label>
                        {attachments.length > 0 && (
                            <button
                                type="button"
                                onClick={clearFiles}
                                className="px-3 py-1 text-red-500 hover:text-red-700"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    {attachments.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600 max-h-[100px] overflow-y-auto">
                            {attachments.map((file, index) => (
                                <li key={index} className="truncate">
                                    {file.name} ({Math.round(file.size / 1024)} KB)
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {error && (
                    <div className="text-red-500 text-sm py-2">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !postData.title || !postData.content}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Posting...
                            </span>
                        ) : "Post"}
                    </button>
                </div>
            </form>
        </div>
    );
}
