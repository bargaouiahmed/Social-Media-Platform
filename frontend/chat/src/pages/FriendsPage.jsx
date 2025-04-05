import { useState, useEffect } from "react";
import { djangoApi } from "../api";
import feedFetching from "../components/utils/feedFetching";

export default function FriendsPage() {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [posts,setPosts] = useState([])

    useEffect(()=>{
        const fetchPosts = async() =>{
            const feed = await feedFetching(friends);
            setPosts(feed)
            console.log("posts!:",posts)
        }
        fetchPosts();
    },[friends])
    const fetchFriends = async () => {
        try {
            const response = await djangoApi.getFriends();
            // Ensure we always get an array, even if API returns empty object
            const friendsList = Array.isArray(response) ? response : [];
            setFriends(friendsList);
            setError(null);
        } catch (error) {
            console.error("Error fetching friends:", error);
            setError("Failed to load friends list. Please try again later.");
            setFriends([]); // Reset to empty array
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    useEffect(() => {
        console.log(friends)
    }, [friends])

    const handleUnfriend = async (relationship_id) => {
        try {
            const response = await djangoApi.unfriend(relationship_id);
            console.log(response);
            setFriends(friends.filter(friend => friend.id !== relationship_id));
        } catch (error) {
            console.error("Error unfriending:", error);
            setError("Failed to unfriend. Please try again later.");
        } finally {
            setLoading(false);
        }
    }

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        fetchFriends();
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Friends</h2>

            {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded-md mb-4 flex justify-between items-center">
                    <span>{error}</span>
                    <button
                        onClick={handleRetry}
                        className="bg-white text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-50 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-gray-600 py-4">Loading friends...</div>
            ) : (
                <div className="friends-list">
                    {friends.length === 0 ? (
                        <p className="text-gray-600 py-4">You don't have any friends yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {friends.map((friend, index) => (
                                <li key={index} className="py-3 flex justify-between items-center">
                                    <span className="font-medium text-gray-800">
                                        {friend.username || `Friend ${index + 1}`}
                                    </span>
                                    <button
                                        onClick={() => handleUnfriend(friend.relationship_id)}
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-200 transition-colors"
                                    >
                                        Unfriend
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
