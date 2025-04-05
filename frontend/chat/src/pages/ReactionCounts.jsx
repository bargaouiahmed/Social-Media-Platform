import { useEffect, useState, useRef } from "react";
import { djangoApi } from "../api";

export default function ReactionCounts({ postId, refreshKey }) {
    const [reactionData, setReactionData] = useState([]);
    const [reactionCount, setReactionCount] = useState({
        like: 0,
        love: 0,
        dislike: 0,
        hate: 0
    });
    const [showReactionModal, setShowReactionModal] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        const fetchReactions = async () => {
            const response = await djangoApi.getReactionsToPost(postId);
            setReactionData(response.data.map((entry) => ({
                reaction: entry.reaction,
                user: entry.user,
                userId: entry.user.id,
                username: entry.user.username
            })));
        };
        fetchReactions();
    }, [postId, refreshKey]);

    useEffect(() => {
        const reactionObj = { like: 0, love: 0, dislike: 0, hate: 0 };
        reactionData.forEach((entry) => {
            reactionObj[entry.reaction]++;
        });
        setReactionCount(reactionObj);
    }, [reactionData]);

    // Close modal when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowReactionModal(false);
            }
        }

        if (showReactionModal) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showReactionModal]);

    // Emoji mapping for reactions
    const reactionEmojis = {
        like: '👍',
        love: '❤️',
        dislike: '👎',
        hate: '😠'
    };

    // Group reactions by type
    const groupedReactions = reactionData.reduce((acc, reaction) => {
        if (!acc[reaction.reaction]) {
            acc[reaction.reaction] = [];
        }
        acc[reaction.reaction].push(reaction);
        return acc;
    }, {});

    return (
        <>
            <div
                className="reaction-counts border-t border-gray-200 pt-3 px-6 pb-4 cursor-pointer"
                onClick={() => setShowReactionModal(true)}
            >
                <div className="flex justify-between items-center">
                    {Object.entries(reactionCount).map(([reaction, count]) => (
                        count > 0 && (
                            <div
                                key={reaction}
                                className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <span className="text-lg">{reactionEmojis[reaction]}</span>
                                <span className="text-sm font-medium text-gray-700">{count}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Reaction Details Modal */}
            {showReactionModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowReactionModal(false)}
                >
                    <div
                        ref={modalRef}
                        className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Reactions</h3>
                                <button
                                    onClick={() => setShowReactionModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(groupedReactions).map(([reactionType, reactions]) => (
                                    <div key={reactionType} className="border-b pb-4 last:border-0">
                                        <div className="flex items-center mb-3">
                                            <span className="text-2xl mr-2">{reactionEmojis[reactionType]}</span>
                                            <span className="font-medium capitalize">{reactionType}</span>
                                            <span className="ml-auto text-gray-500">{reactions.length}</span>
                                        </div>

                                        <div className="space-y-2">
                                            {reactions.map((reaction) => (
                                                <div key={reaction.userId} className="flex items-center">
                                                    <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3">
                                                        {reaction.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{reaction.username}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
