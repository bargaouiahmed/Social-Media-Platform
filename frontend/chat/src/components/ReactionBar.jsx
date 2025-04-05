import { useEffect, useState, useCallback, useMemo } from "react";
import { djangoApi } from "../api";
import "./ReactionBar.css";

export default function ReactionBar({ postId, refresh }) {
  const [userReactions, setUserReactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized reaction types to prevent unnecessary re-renders
  const reactionTypes = useMemo(() => [
    { type: 'like', icon: '👍', label: 'Like' },
    { type: 'love', icon: '❤️', label: 'Love' },
    { type: 'dislike', icon: '👎', label: 'Dislike' },
    { type: 'hate', icon: '😠', label: 'Hate' }
  ], []);

  // Derive current reaction from userReactions and postId
  const currentReaction = useMemo(() => {
    return userReactions.find(r => r.post === postId)?.reaction || '';
  }, [userReactions, postId]);

  // Fetch all reactions for the current user
  const fetchReactions = useCallback(async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      const response = await djangoApi.getMyReactionToPost(postId);
      console.log(`API Response:`, response.data);

      if (Array.isArray(response.data)) {
        setUserReactions(response.data);
      }
    } catch (e) {
      console.error(`Failed to fetch reactions`, e);
      setUserReactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Initial fetch and refresh when dependencies change
  useEffect(() => {
    fetchReactions();
  }, [postId, fetchReactions, refresh]);

  const handleReaction = async (reactionType) => {
    if (isLoading || !postId) return;

    setIsLoading(true);
    try {
      if (currentReaction === reactionType) {
        // Remove reaction
        await djangoApi.unreact(postId);
        setUserReactions(prev => prev.filter(r => r.post !== postId));
      } else {
        // Add/update reaction
        await djangoApi.react({ post_id: postId, reaction_type: reactionType });
        setUserReactions(prev => [
          ...prev.filter(r => r.post !== postId),
          { post: postId, reaction: reactionType }
        ]);
      }
    } catch (e) {
      console.error(`Reaction update failed for post ${postId}`, e);
    } finally {
      setIsLoading(false);
      if (refresh) refresh(); // Optional: trigger parent refresh
    }
  };

  return (
    <div className="reaction-bar">

      {reactionTypes.map((reaction) => (
        <button
          key={reaction.type}
          className={`reaction-option ${currentReaction === reaction.type ? 'active' : ''}`}
          onClick={() => handleReaction(reaction.type)}
          disabled={isLoading}
          aria-label={reaction.label}
          aria-pressed={currentReaction === reaction.type}
        >
          <span className="reaction-icon">{reaction.icon}</span>
          <span className="reaction-label">{reaction.label}</span>
        </button>
      ))}
    </div>
  );
}
