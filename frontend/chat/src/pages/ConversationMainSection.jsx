import { useState, useEffect, useRef } from "react";
import { expressApi, socketClient } from "../api";
import MessageShow from "./MessageShow";
import SendMessage from "./SendMessage";

export default function ConversationMainSection({ conversationId }) {
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [otherPartyOnline, setOtherPartyOnline] = useState(false);
  const currentUserId = parseInt(sessionStorage.getItem('user_id'));
  const componentMountedRef = useRef(true);

  // Ensure we have a number for consistent comparisons
  const normalizedCurrentUserId = Number(currentUserId);

  // Debug helper
  const logWithContext = (message, data) => {
    console.log(`[Convo:${conversationId}/User:${normalizedCurrentUserId}] ${message}`, data || '');
  };

  const handleParticipantsUpdate = (participants) => {
    if (!componentMountedRef.current) return;

    // Ensure we have an array even if null/undefined comes in
    const safeParticipants = Array.isArray(participants) ? participants : [];

    // Store the connected participants
    setConnectedUsers(safeParticipants);

    // For debugging, extract just the IDs for cleaner logs
    const participantIds = safeParticipants.map(p => Number(p.user.id));
    logWithContext('Received participants update:', participantIds);

    // Check if any other user besides the current user is online
    const otherUserOnline = safeParticipants.some(participant =>
      Number(participant.user.id) !== normalizedCurrentUserId
    );

    setOtherPartyOnline(otherUserOnline);
    logWithContext('Other party online status set to:', otherUserOnline);
  };

  const checkParticipants = () => {
    logWithContext('Requesting participants verification');
    socketClient.emit('verify_conversation_participants_connection', conversationId);
  };

  // Handle user status change events
  const handleUserStatusChange = (data) => {
    if (!componentMountedRef.current) return;

    const { userId, online } = data;
    logWithContext(`User ${userId} status changed to ${online ? 'online' : 'offline'}`);

    // If one of our participants changed status, request a full verification
    checkParticipants();
  };

  useEffect(() => {
    componentMountedRef.current = true;
    logWithContext('Component mounted');

    // Ensure we're connected as a user first
    socketClient.emit('user_connected', normalizedCurrentUserId);
    logWithContext('Emitted user_connected event');

    // Then join the conversation
    socketClient.emit('join_conversation', conversationId);
    logWithContext('Emitted join_conversation event');

    // Set up listeners for participant status
    socketClient.on('connected_participants', handleParticipantsUpdate);

    // Listen for user status change events
    socketClient.on('user_status_changed', handleUserStatusChange);

    // Listen for new connections to trigger a check
    socketClient.on('new_user_connected', (userId) => {
      logWithContext(`User ${userId} connected, requesting verification`);
      checkParticipants();
    });

    // Listen for user disconnections to update status
    socketClient.on('user_disconnected', (userId) => {
      logWithContext(`User ${userId} disconnected, requesting verification`);
      checkParticipants();
    });

    // Initial check for participants
    setTimeout(() => {
      if (componentMountedRef.current) {
        checkParticipants();
      }
    }, 500); // Small delay to ensure connection is established

    // Set up presence heartbeat to regularly check
    const intervalId = setInterval(() => {
      if (componentMountedRef.current) {
        checkParticipants();
      }
    }, 15000);

    return () => {
      logWithContext('Component unmounting, cleaning up');
      componentMountedRef.current = false;

      // Clean up all listeners
      socketClient.off('connected_participants', handleParticipantsUpdate);
      socketClient.off('user_status_changed', handleUserStatusChange);
      socketClient.off('new_user_connected');
      socketClient.off('user_disconnected');

      // Leave the conversation first
      socketClient.emit('leave_conversation', conversationId);
      logWithContext('Emitted leave_conversation event');

      // Then disconnect user (if this is the last instance)
      socketClient.emit('user_disconnected', normalizedCurrentUserId);
      logWithContext('Emitted user_disconnected event');

      clearInterval(intervalId);
    };
  }, [conversationId, normalizedCurrentUserId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messages = await expressApi.getMessagesInAGivenConvo(conversationId);
      if (componentMountedRef.current) {
        setMessages(messages);
        setLoading(false); // Only set loading to false when messages are loaded
      }
    } catch (err) {
      if (componentMountedRef.current) {
        setError(err);
        setLoading(false); // Make sure to set loading to false on error too
      }
    }
  };

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setNewMessageAlert(false);
  };

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      if (!componentMountedRef.current) return;

      setMessages(prev => [...prev, newMessage]);
      if (!isAtBottom) setNewMessageAlert(true);
    };

    socketClient.on('receive_message', handleNewMessage);
    fetchMessages();

    return () => {
      socketClient.off('receive_message', handleNewMessage);
    };
  }, [conversationId, isAtBottom]);

  useEffect(() => {
    if (isAtBottom) scrollToBottom('auto');
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setIsAtBottom(atBottom);
    atBottom && setNewMessageAlert(false);
  };

  // Only render the loading state when we're still loading messages initially
  if (loading && messages.length === 0) return (
    <div className="flex-1 flex items-center justify-center text-blue-500">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center text-red-500 p-4">
      Error: {error.message}
    </div>
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Online status indicator */}
      <div className="bg-gray-800 p-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          {otherPartyOnline ? (
            <div className="flex items-center mr-2">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-gray-300">Online</span>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Offline</div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-1 space-y-2"
      >
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400 text-center p-4">
            <div>
              <svg
                className="w-10 h-10 mx-auto mb-3 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm">No messages yet. Start a conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageShow key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {newMessageAlert && (
        <button
          className="fixed bottom-16 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs rounded-full px-3 py-1 shadow-lg z-10"
          onClick={() => scrollToBottom("smooth")}
        >
          New messages ↓
        </button>
      )}

      <div className="p-1 bg-gray-800 border-t border-gray-700 sticky bottom-0">
        <SendMessage conversationId={conversationId} />
      </div>
    </div>
  );
}
