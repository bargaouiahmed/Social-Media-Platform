import { useState, useRef, useEffect } from "react";
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
    const contentRef = useRef(null);

    // Setup paste event listener for the entire component
    useEffect(() => {
        const handlePaste = (e) => {
            // Only process paste if focused in the content area or component itself
            if (document.activeElement === contentRef.current ||
                contentRef.current?.contains(document.activeElement)) {

                const items = e.clipboardData?.items;
                if (!items) return;

                let hasProcessedFile = false;

                // Process clipboard items
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];

                    // Handle any file type, not just images
                    if (item.kind === 'file') {
                        e.preventDefault(); // Prevent default paste behavior

                        // Get the blob from clipboard
                        const blob = item.getAsFile();
                        if (!blob) continue;

                        hasProcessedFile = true;

                        // Create a filename with timestamp to prevent duplicates
                        // Use the MIME type to determine a reasonable extension
                        const mimeType = blob.type;
                        let extension = 'bin'; // Default for unknown types

                        // Try to get extension from original filename if available
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

                        // Add to attachments
                        setAttachments(prev => [...prev, file]);
                    }
                }

                // If we processed any files, prevent the default paste behavior
                if (hasProcessedFile) {
                    e.preventDefault();
                }
            }
        };

        // Add paste event listener
        window.addEventListener('paste', handlePaste);

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, []);

    const handlePostChange = (e) => {
        setPostData({
            ...postData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
    };

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

            // Add files one by one with distinct index in the name
            attachments.forEach((file) => {
                formData.append(`attachments`, file);
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

    // Remove a specific attachment by index
    const removeAttachment = (indexToRemove) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // Helper function to get file icon based on MIME type
    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith('image/')) {
            return (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
            );
        } else if (mimeType.startsWith('video/')) {
            return (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12 2a1 1 0 011 1v4a1 1 0 01-1.707.707L11 12.414V7.586l2.293-2.293A1 1 0 0114 6v2z" />
                </svg>
            );
        } else if (mimeType.startsWith('audio/')) {
            return (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
            );
        } else if (mimeType.startsWith('application/pdf')) {
            return (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    <path d="M8 7a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1v-5a1 1 0 00-1-1H8z" />
                </svg>
            );
        } else if (mimeType.startsWith('text/')) {
            return (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2H4v-1h16v1h-1z" clipRule="evenodd" />
                </svg>
            );
        } else {
            return (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
            );
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

                {/* Content field with paste functionality */}
                <div ref={contentRef}>
                    <label className="block text-gray-700 font-medium mb-1">Content*</label>
                    <div className="relative">
                        <textarea
                            name="content"
                            value={postData.content}
                            onChange={handlePostChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                            placeholder="What's on your mind? You can paste any files directly here!"
                            required
                            minLength="10"
                        />
                        <div className="absolute bottom-2 right-2 text-gray-400 text-sm">
                            Paste files with Ctrl+V / Cmd+V
                        </div>
                    </div>
                </div>

                {/* Attachments field */}
                <div>
                    <div className="flex items-center justify-between">
                        <label className="block text-gray-700 font-medium">
                            Attachments
                            <span className="text-sm text-gray-500 ml-1">(Optional)</span>
                        </label>
                        {attachments.length > 0 && (
                            <button
                                type="button"
                                onClick={clearFiles}
                                className="text-sm text-red-500 hover:text-red-700"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            className="hidden"
                            id="post-attachments"
                            name="attachments"
                        />
                        <label
                            htmlFor="post-attachments"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-center"
                        >
                            Select files...
                        </label>
                    </div>

                    {/* Display attached files with preview and remove button */}
                    {attachments.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="relative border rounded-md p-2 bg-gray-50">
                                    {/* File preview based on type */}
                                    <div className="h-24 flex items-center justify-center overflow-hidden">
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-gray-500">
                                                {getFileIcon(file.type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* File name and size */}
                                    <div className="mt-1 text-xs text-gray-600 truncate">
                                        {file.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {Math.round(file.size / 1024)} KB
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-100 text-red-500 rounded-full hover:bg-red-200"
                                        title="Remove file"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
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
