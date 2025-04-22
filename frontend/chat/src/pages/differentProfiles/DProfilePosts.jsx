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
            {loading && <div>...Loading</div>}
            <div className="space-y-6">
                {!loading && posts.length === 0 && (
                    <div className="text-center text-gray-500">
                        No posts available at the moment.
                    </div>
                )}
                {!loading && posts.map((post) => (
                    <DProfilePostModal key={post.id} post={post} />
                ))}
            </div>
        </>
    );
}