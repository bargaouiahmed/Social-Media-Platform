import { useState, useRef, useEffect } from "react";
import ReactionBar from "./ReactionBar";
import CommentModal from "./CommentModal";
import PostComments from "./PostComments";
import AttachmentCard from "../pages/AttachmentCard";
import AttachmentViewer from "./AttachmentViewer";

export default function PostPopup({ id, author, title, content, createdAt, attachments, onClose, refresh }) {
    const [addComment, setAddComment] = useState(false);
    const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [checkingComms, setCheckingComms] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        console.log(attachments);
    }, []);

    // Close modal when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        }

        // Add event listener when component mounts
        document.addEventListener("mousedown", handleClickOutside);

        // Remove event listener when component unmounts
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const onclose = () => {
        setAddComment(false);
    };

    const onStop = () => {
        setCheckingComms(false);
    };

    const handleAttachmentClick = (index) => {
        setSelectedAttachmentIndex(index);
        setIsViewerOpen(true);
    };

    const handleNextAttachment = () => {
        if (selectedAttachmentIndex < attachments.length - 1) {
            setSelectedAttachmentIndex(prev => prev + 1);
        }
    };

    const handlePrevAttachment = () => {
        if (selectedAttachmentIndex > 0) {
            setSelectedAttachmentIndex(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                ref={modalRef}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
            >
                <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <div className="bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center mr-3">
                                {author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">{author}</h3>
                                <p className="text-xs text-gray-500">{formattedDate}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>

                    <div className="text-gray-600 mb-6 break-words overflow-wrap-anywhere whitespace-normal">
                        {content.split('\n').map((paragraph, i) => (
                            <p key={i} className="mb-4 last:mb-0">
                                {paragraph || <br />}
                            </p>
                        ))}
                    </div>

                    {/* Full attachments display */}
                    {attachments.map((attachment, index) => (
                        <div
                            key={attachment.id}
                            className="attachment-card cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleAttachmentClick(index)}
                        >
                            <AttachmentCard attachment={attachment} disableDelete={true} size={"auto"}/>
                        </div>
                    ))}
                </div>

                {/* Reaction and comment sections */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                    <ReactionBar postId={id} refresh={refresh}/>
                </div>
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                    <button
                        onClick={() => {
                            setCheckingComms(true);
                            setAddComment(false); // Close comment modal if open
                        }}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={addComment} // Disable when comment modal is open
                    >
                        View Comments
                    </button>
                </div>
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                    <button
                        onClick={() => {
                            setAddComment(true);
                            setCheckingComms(false); // Close comments view if open
                        }}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={checkingComms} // Disable when viewing comments
                    >
                        Add Comment
                    </button>
                </div>

                {/* Modals - only one can be open at a time */}
                {isViewerOpen && (
                    <AttachmentViewer
                        attachments={attachments}
                        currentIndex={selectedAttachmentIndex}
                        onClose={() => setIsViewerOpen(false)}
                        onNext={handleNextAttachment}
                        onPrev={handlePrevAttachment}
                    />
                )}

                {checkingComms && !addComment && (
                    <PostComments
                        postId={id}
                        onClose={onStop}
                        onAddComment={() => {
                            onStop(); // Close comments view
                            setAddComment(true); // Open comment modal
                        }}
                    />
                )}

                {addComment && !checkingComms && (
                    <CommentModal
                        post={id}
                        onClose={onclose}
                        onCommentAdded={() => {
                            onclose(); // Close comment modal
                            refresh(); // Refresh comments
                        }}
                    />
                )}
            </div>
        </div>
    );
}
