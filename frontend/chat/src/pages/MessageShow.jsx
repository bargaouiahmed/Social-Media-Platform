import React from "react";

export default function MessageShow({ message }) {
  const userName = sessionStorage.getItem('username');
  const isCurrentUser = message.participant.user.username === userName;

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2 px-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-md ${
          isCurrentUser
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
            : 'bg-gray-700 text-white'
        }`}
      >
        {!isCurrentUser && (
          <div className="text-xs text-gray-300 mb-1 font-medium">
            {message.participant.user.username}
          </div>
        )}
        <div className="break-words text-sm">{message.content}</div>
        <div className="text-xs text-right mt-1 opacity-70">
          {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}
