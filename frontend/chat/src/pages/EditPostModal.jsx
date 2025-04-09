import { useState, useRef, useEffect } from "react";
import AttachmentCard from "./AttachmentCard";

export default function EditPostModal({
    post: initialPost,
    onClose,
    onSave,
    onDelete,
    onAddAttachment,
    onDeleteAttachment
}) {
    const [currentPost, setCurrentPost] = useState({
        ...initialPost,
        attachments: initialPost.attachments || [] // Ensure attachments is always an array
    });
    const [editedTitle, setEditedTitle] = useState(initialPost.title);
    const [editedContent, setEditedContent] = useState(initialPost.content);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingAttachments, setDeletingAttachments] = useState({});
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);
    const contentRef = useRef(null);

    // Close modal when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    // Setup paste event listener for content area
    useEffect(() => {
        const handlePaste = async (e) => {
            // Only process paste if focused in the content area
            if (document.activeElement === contentRef.current ||
                contentRef.current?.contains(document.activeElement)) {

                const items = e.clipboardData?.items;
                if (!items) return;

                // Look for image items in the clipboard
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];

                    // Handle image files
                    if (item.type.indexOf('image') !== -1) {
                        e.preventDefault(); // Prevent default paste behavior

                        // Get the blob from clipboard
                        const blob = item.getAsFile();
                        if (!blob) continue;

                        // Create a filename with timestamp to prevent duplicates
                        const originalExt = blob.name?.split('.').pop() || 'png';
                        const filename = `pasted-image-${Date.now()}.${originalExt}`;

                        // Create a new File object with a proper name
                        const file = new File([blob], filename, { type: blob.type });

                        // Upload the pasted file
                        setIsUploading(true);
                        try {
                            const response = await onAddAttachment(file, currentPost.id);
                            setCurrentPost(prev => ({
                                ...prev,
                                attachments: [...prev.attachments, response.data]
                            }));
                        } catch (error) {
                            console.error("Error uploading pasted attachment:", error);
                        } finally {
                            setIsUploading(false);
                        }
                    }
                }
            }
        };

        // Add paste event listener
        window.addEventListener('paste', handlePaste);

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [currentPost.id, onAddAttachment]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                id: currentPost.id,
                title: editedTitle,
                content: editedContent
            });
            onClose();
        } catch (error) {
            console.error("Error saving post:", error);
        } finally {
            setIsSaving(false);
            window.location.reload()
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        setDeletingAttachments(prev => ({ ...prev, [attachmentId]: true }));

        const updatedPost = {
            ...currentPost,
            attachments: currentPost.attachments.filter(att => att.id !== attachmentId)
        };

        setCurrentPost(updatedPost);

        try {
            await onDeleteAttachment(attachmentId, updatedPost);
        } catch (error) {
            console.error("Error deleting attachment:", error);
            setCurrentPost(initialPost);
        } finally {
            setDeletingAttachments(prev => ({ ...prev, [attachmentId]: false }));
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(currentPost.id);
            onClose();
        } catch (error) {
            console.error("Error deleting post:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFileChange = async (e) => {
        if (e.target.files.length === 0) return;

        setIsUploading(true);
        try {
            const response = await onAddAttachment(e.target.files[0], currentPost.id);
            setCurrentPost({
                ...currentPost,
                attachments: [...(currentPost.attachments || []), response.data]
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error("Error uploading attachment:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                ref={modalRef}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()} // Prevent click propagation
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Edit Post</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="mb-4" ref={contentRef}>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                        </label>
                        <div className="relative">
                            <textarea
                                id="content"
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute bottom-2 right-2 text-gray-400 text-xs">
                                Paste images with Ctrl+V / Cmd+V
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                                Add Attachment
                            </label>
                            {isUploading && (
                                <span className="text-sm text-blue-500 animate-pulse">
                                    Uploading...
                                </span>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className={`mt-1 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 inline-block ${
                                isUploading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            Select File
                        </label>
                    </div>

                    {currentPost?.attachments?.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Attachments
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {currentPost.attachments
                                    .filter(attachment => attachment?.id)
                                    .map(attachment => (
                                        <AttachmentCard
                                            key={attachment.id}
                                            attachment={attachment}
                                            onDelete={() => handleDeleteAttachment(attachment.id)}
                                            isDeleting={deletingAttachments[attachment.id]}
                                            disableDelete={false}
                                            size="auto"
                                        />
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Post'}
                        </button>
                        <div className="space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || (!editedTitle.trim() || !editedContent.trim())}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
