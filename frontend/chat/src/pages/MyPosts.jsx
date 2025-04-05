import { useEffect, useState } from "react";
import { djangoApi } from "../api";
import EditPostModal from "./EditPostModal";

export default function MyPosts({ refreshTrigger }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingPost, setEditingPost] = useState(null);

    const deleteAttachment = async (attachmentId, updatedPost) => {
        try {
            await djangoApi.deleteAttachment(attachmentId);
            setPosts(posts.map(p =>
                p.id === updatedPost.id ? updatedPost : p
            ));
        } catch (error) {
            console.error("Error deleting attachment:", error);
            throw error;
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchMyPosts = async () => {
            try {
                const response = await djangoApi.getCurrentPosts();
                if (isMounted) setPosts(response.data);
            } catch (err) {
                if (isMounted) {
                    setError("Failed to load posts");
                    console.error("Error fetching posts:", err);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchMyPosts();
        return () => { isMounted = false; };
    }, [refreshTrigger]);

    const handleSavePost = async (updatedPost) => {
        try {
            const response = await djangoApi.updatePost(updatedPost.id, {
                title: updatedPost.title,
                content: updatedPost.content
            });
            setPosts(posts.map(post =>
                post.id === updatedPost.id ? { ...post, ...response.data } : post
            ));
            setEditingPost(null);
        } catch (error) {
            console.error("Error updating post:", error);
            throw error;
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await djangoApi.deletePost(postId);
            setPosts(posts.filter(post => post.id !== postId));
            setEditingPost(null);
        } catch (error) {
            console.error("Error deleting post:", error);
            throw error;
        }
    };

    const handleAddAttachment = async (file, postId) => {
        try {
            const response = await djangoApi.addAttachment(file, postId);
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        attachments: [
                            ...(post.attachments || []),
                            response.data
                        ]
                    };
                }
                return post;
            }));
            return response;
        } catch (error) {
            console.error("Error adding attachment:", error);
            throw error;
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="animate-pulse flex space-x-2">
                <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
            </div>
            <span className="mt-2 text-sm sm:text-base text-gray-600">Loading your posts...</span>
        </div>
    );

    if (error) return (
        <div className="text-red-500 py-4 px-4 text-center border border-red-200 rounded-lg bg-red-50 mx-4">
            {error}
        </div>
    );

    return (
        <div className="mx-auto px-4 py-6 max-w-4xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">My Posts</h2>

            {editingPost && (
                <EditPostModal
                    post={editingPost}
                    onClose={() => setEditingPost(null)}
                    onSave={handleSavePost}
                    onDelete={handleDeletePost}
                    onAddAttachment={handleAddAttachment}
                    onDeleteAttachment={(attachmentId, updatedPost) => deleteAttachment(attachmentId, updatedPost)}
                />
            )}

            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => (
                        <div
                            key={post.id}
                            className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition duration-300 cursor-pointer"
                            onClick={() => setEditingPost(post)}
                        >
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">{post.title}</h3>
                            <p className="text-gray-600 mb-3 sm:mb-4 whitespace-pre-line text-sm sm:text-base">
                                {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                            </p>

                            {post.attachments?.length > 0 && (
                                <div className="mb-2 sm:mb-3">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Attachments:</h4>
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                        {post.attachments
                                            .filter(attachment => attachment?.file)
                                            .map(attachment => (
                                                <span
                                                    key={attachment.id}
                                                    className="text-xs sm:text-sm text-blue-500 hover:underline break-all"
                                                >
                                                    {attachment.file.split('/').pop()}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}
                            <div className="text-xs sm:text-sm text-gray-500">
                                Created: {new Date(post.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-6 sm:py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 mx-2 sm:mx-0">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2 sm:mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm sm:text-lg">You haven't created any posts yet.</p>
                </div>
            )}
        </div>
    );
}
