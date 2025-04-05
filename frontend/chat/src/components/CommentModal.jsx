import { useState, useRef, useEffect } from "react";
import { djangoApi } from "../api";

export default function CommentModal({ post, onClose }) {
    const [comment, setComment] = useState("");
    const modalRef = useRef(null);

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

    const handleUpdate = (e) => {
        setComment(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await djangoApi.comment(comment, post);
            console.log(response);
            onClose();
        } catch (e) {
            console.log(e);
        }
    };

    // Custom styles for elements that need precise control
    const customStyles = {
        modalOverlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(2px)",
        },
        textarea: {
            minHeight: "120px",
        },
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={customStyles.modalOverlay}
        >
            <div
                ref={modalRef}
                className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()} // Prevent click propagation
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Add a Comment</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-4">
                    <textarea
                        value={comment}
                        onChange={handleUpdate}
                        placeholder="Write your comment here..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                        style={customStyles.textarea}
                        required
                    />

                    {/* Modal Footer */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Post Comment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
