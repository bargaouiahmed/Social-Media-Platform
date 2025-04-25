import { useState, useEffect } from "react";
import { djangoApi } from "../../api";
import DProfilePostModal from "./DProfilePostModal";

export default function DProfilePosts({ userId }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const getPosts = async () => {
        try {
            const response = await djangoApi.getSpecificUserPosts(userId);
            setPosts(response || []);
            setLoading(false);
        } catch (e) {
            console.error("Error fetching posts:", e);
            setLoading(false);
        }
    };

    useEffect(() => {
        getPosts();
    }, [userId]);

    return (
        <>
            {loading && (
                <div className="flex justify-center items-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
            <div className="space-y-4 sm:space-y-8">
                {!loading && posts.length === 0 && (
                    <div className="text-center py-8 sm:py-16 bg-blue-50 rounded-xl border border-blue-100">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-blue-300 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                        </svg>
                        <p className="text-gray-500 font-medium text-sm sm:text-base">No posts available at the moment.</p>
                        <p className="text-blue-400 text-xs sm:text-sm mt-2">Posts will appear here once created.</p>
                    </div>
                )}
                <div className="grid gap-4 sm:gap-8">
                    {!loading && posts.map((post) => (
                        <div key={post.id} className="transform transition-all duration-300 hover:scale-[1.01] overflow-hidden">
                            <DProfilePostModal post={post} />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}