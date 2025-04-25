import { useEffect, useState, useCallback, useMemo } from "react";
import { djangoApi } from "../api";
import "./ReactionBar.css";

export default function ReactionBar({ postId, refresh, onReactionUpdate, currentReaction }) {
  const [userReactions, setUserReactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized reaction types to prevent unnecessary re-renders
  const reactionTypes = useMemo(() => [
    { type: 'like', icon: '👍', label: 'Like' },
    { type: 'love', icon: '❤️', label: 'Love' },
    { type: 'dislike', icon: '👎', label: 'Dislike' },
    { type: 'hate', icon: '😠', label: 'Hate' }
  ], []);

  // Derive current reaction from either prop (preferred) or userReactions
  const activeReaction = currentReaction || useMemo(() => {
    return userReactions.find(r => r.post === postId)?.reaction || '';
  }, [userReactions, postId, currentReaction]);

  // Fetch all reactions for the current user
  const fetchReactions = useCallback(async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      const response = await djangoApi.getMyReactionToPost(postId);
      console.log(`API Response for reactions:`, response.data);

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
  }, [fetchReactions]);

  const handleReaction = async (reactionType) => {
    if (isLoading || !postId) return;

    // Start loading state
    setIsLoading(true);
    
    try {
      // If clicking the same reaction user already has, remove it
      const isRemovingReaction = activeReaction === reactionType;
      
      if (isRemovingReaction) {
        // Remove reaction
        await djangoApi.unreact(postId);
        
        // Update local state
        setUserReactions(prev => prev.filter(r => r.post !== postId));
        
        // Notify parent
        if (onReactionUpdate) {
          onReactionUpdate(reactionType, false);
        }
      } else {
        // Add/update reaction (might be adding first reaction or changing existing one)
        await djangoApi.react({ post_id: postId, reaction_type: reactionType });
        
        // Update local state
        setUserReactions(prev => [
          ...prev.filter(r => r.post !== postId),
          { post: postId, reaction: reactionType }
        ]);
        
        // Notify parent - we're adding a new reaction
        if (onReactionUpdate) {
          onReactionUpdate(reactionType, true);
        }
      }
    } catch (e) {
      console.error(`Reaction update failed for post ${postId}`, e);
    } finally {
      setIsLoading(false);
      if (refresh) refresh(); // Optional: trigger parent refresh as fallback
    }
  };

  return (
    <div className="reaction-bar">
      {reactionTypes.map((reaction) => (
        <button
          key={reaction.type}
          className={`reaction-option ${activeReaction === reaction.type ? 'active' : ''}`}
          onClick={() => handleReaction(reaction.type)}
          disabled={isLoading}
          aria-label={reaction.label}
          aria-pressed={activeReaction === reaction.type}
        >
          <span className="reaction-icon">{reaction.icon}</span>
          <span className="reaction-label">{reaction.label}</span>
        </button>
      ))}
    </div>
  );
}
