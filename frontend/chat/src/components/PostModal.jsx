import { useState } from "react";
import PostPopup from "./PostPopup";
import ReactionCounts from "../pages/ReactionCounts";
import AttachmentCard from "../pages/AttachmentCard";

export default function PostModal({id, author, title, content, createdAt, reactions, attachments}) {
    const [showPopup, setShowPopup] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const refresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handlePostClick = (e) => {
        if (!e.target.closest('.reaction-counts') && !e.target.closest('.attachment-card')) {
            setShowPopup(true);
        }
    };

    return (
        <>
            <div
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={handlePostClick}
            >
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center mr-3">
                            {author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">{author}</h3>
                            <p className="text-xs text-gray-500">{formattedDate}</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>

                    <div className="text-gray-600 mb-4">
                        {content.split('\n').map((paragraph, i) => (
                            <p key={i} className="mb-2 overflow-hidden last:mb-0">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    {/* Add attachments preview */}
                    {attachments?.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {attachments.slice(0, 2).map(attachment => (
                                <div key={attachment.id} className="attachment-card">
                                    <AttachmentCard attachment={attachment} size={"auto"} />
                                </div>
                            ))}
                            {attachments.length > 2 && (
                                <div className="bg-gray-100 rounded flex items-center justify-center">
                                    +{attachments.length - 2} more
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <ReactionCounts postId={id} refreshKey={refreshKey}/>
                </div>
            </div>

            {showPopup && (
                <PostPopup
                    author={author}
                    id={id}
                    title={title}
                    content={content}
                    createdAt={createdAt}
                    reactions={reactions}
                    attachments={attachments}
                    onClose={() => setShowPopup(false)}
                    refresh={refresh}
                />
            )}
        </>
    );
}
