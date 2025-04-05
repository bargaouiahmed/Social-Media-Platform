import { useState, useEffect, useCallback } from "react";
import { djangoApi } from "../api";
import feedFetching from "../components/utils/feedFetching";
import PostModal from "../components/PostModal";

export default function Feed() {
    const [friends, setFriends] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const controller = new AbortController();
            const signal = controller.signal;

            setLoading(!isRefreshing);
            setError(null);

            // 1. Fetch friends
            const friendsResponse = await djangoApi.getFriends({ signal });
            const friendsList = Array.isArray(friendsResponse) ? friendsResponse : [];
            setFriends(friendsList);

            // 2. Fetch all posts in parallel
            const [friendsPostsResponse, myPostsResponse] = await Promise.all([
                friendsList.length > 0 ? feedFetching(friendsList, { signal }) : Promise.resolve([]),
                djangoApi.getCurrentPosts({ signal })
            ]);

            // Combine and deduplicate posts
            const allPosts = [...friendsPostsResponse, ...myPostsResponse.data];
            const uniquePosts = allPosts.reduce((acc, post) => {
                if (!acc.some(p => p.id === post.id)) {
                    acc.push(post);
                }
                return acc;
            }, []);

            setPosts(uniquePosts);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError("Failed to load feed. Please try again.");
                console.error(err);
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    useEffect(() => {
        fetchData();
        return () => {
            // Cleanup function for aborting requests
        };
    }, [fetchData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 max-w-md w-full">
                    <p>{error}</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Your Feed</h1>
                <button
                    onClick={handleRefresh}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <PostModal
                            key={post.id}
                            id={post.id}
                            author={post.author.username}
                            title={post.title}
                            content={post.content}
                            createdAt={post.created_at}
                            reactions={post.reactions}
                            attachments={post.attachments || []}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <div className="text-gray-500 text-lg">No posts to display</div>
                        <p className="text-gray-400 mt-2">When your friends post, you'll see it here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
