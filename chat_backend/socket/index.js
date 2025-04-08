const { Message, Conversation, Participant, AuthUser } = require('../models');

// Track connections more accurately
const userConnectionCounts = new Map(); // { userId: connectionCount }
const socketToUserMap = new Map(); // { socketId: userId }
const socketToConversationMap = new Map(); // { socketId: conversationId }

module.exports = (io) => {
    // Debug helper to get current state
    const getDebugState = () => {
        return {
            connCounts: Object.fromEntries([...userConnectionCounts.entries()]),
            socketCount: socketToUserMap.size,
            socketMap: Array.from(socketToUserMap.entries()).reduce((acc, [socketId, userId]) => {
                acc[socketId.slice(0, 6) + '...'] = userId;
                return acc;
            }, {})
        };
    };

    // Log state helper
    const logState = (action) => {
        console.log(`[${action}] STATE:`, JSON.stringify(getDebugState()));
    };

    io.on('connection', (socket) => {
        console.log('WebSocket client connected:', socket.id);
        logState('NEW_CONNECTION');

        socket.on('user_connected', (userId) => {
            // Cast to number if needed to ensure consistent comparison
            userId = Number(userId);

            // Track user connections
            const count = userConnectionCounts.get(userId) || 0;
            userConnectionCounts.set(userId, count + 1);
            socketToUserMap.set(socket.id, userId);

            console.log(`User ${userId} connected (${count + 1} connections)`);
            io.emit("new_user_connected", userId);
            logState(`USER_CONNECTED:${userId}`);
        });

        socket.on('verify_conversation_participants_connection', async (conversationId) => {
            // Store the conversation mapping
            socketToConversationMap.set(socket.id, conversationId);

            const participants = await Participant.findAll({
                where: { conversationId },
                include: {
                    model: AuthUser,
                    as: "user",
                    attributes: ['id', 'username', 'first_name', 'last_name', 'email']
                }
            });

            // Log all participants found in the DB
            console.log(`DB participants for convo ${conversationId}:`,
                participants.map(p => p.user.id));

            // Only consider a participant connected if their connection count is > 0
            const connectedParticipants = participants.filter(participant => {
                const userId = participant.user.id;
                const connectionCount = userConnectionCounts.get(Number(userId)) || 0;
                console.log(`Checking user ${userId}: connection count = ${connectionCount}`);
                return connectionCount > 0;
            });

            const connectedIds = connectedParticipants.map(p => p.user.id);
            console.log(`Filtered connected participants: ${connectedIds}`);

            socket.emit("connected_participants", connectedParticipants);
            logState(`VERIFY_PARTICIPANTS:${conversationId}`);
        });

        // Handle manual disconnection
        socket.on('user_disconnected', (userId) => {
            // Cast to number if needed to ensure consistent comparison
            userId = Number(userId);
            handleUserDisconnection(socket.id, userId);
        });

        socket.on("join_conversation", (conversationId) => {
            socket.join(conversationId);
            socketToConversationMap.set(socket.id, conversationId);
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
            logState(`JOIN_CONVERSATION:${conversationId}`);
        });

        socket.on("leave_conversation", (conversationId) => {
            socket.leave(conversationId);
            socketToConversationMap.delete(socket.id);
            console.log(`Socket ${socket.id} left conversation ${conversationId}`);
            logState(`LEAVE_CONVERSATION:${conversationId}`);
        });

        socket.on("new_message", async (data) => {
            const { content, conversationId, userId } = data;
            const participant = await Participant.findOne({
                where: { userId, conversationId },
                include: {
                    model: AuthUser,
                    as: "user",
                    attributes: ['id', 'username', 'first_name', 'last_name', 'email']
                }
            });

            const message = await Message.create({
                content,
                participantId: participant.id
            });

            io.to(conversationId).emit('receive_message', {
                ...message.dataValues,
                participant
            });
        });

        // Handle automatic disconnection
        socket.on('disconnect', () => {
            console.log('WebSocket client disconnected:', socket.id);
            const userId = socketToUserMap.get(socket.id);
            if (userId) {
                handleUserDisconnection(socket.id, userId);
            } else {
                console.log(`Socket ${socket.id} disconnected but no user was associated`);
                socketToUserMap.delete(socket.id);
                const conversationId = socketToConversationMap.get(socket.id);
                if (conversationId) {
                    socketToConversationMap.delete(socket.id);
                }
            }
            logState('DISCONNECT');
        });
    });

    // Centralized function to handle user disconnection
    function handleUserDisconnection(socketId, userId) {
        // Ensure userId is a number for consistent comparisons
        userId = Number(userId);

        const count = userConnectionCounts.get(userId) || 0;

        if (count <= 1) {
            userConnectionCounts.delete(userId);
            console.log(`User ${userId} fully disconnected (no connections remain)`);
        } else {
            userConnectionCounts.set(userId, count - 1);
            console.log(`User ${userId} disconnected (${count - 1} connections remain)`);
        }

        // Clean up socket mappings
        socketToUserMap.delete(socketId);
        const conversationId = socketToConversationMap.get(socketId);
        if (conversationId) {
            socketToConversationMap.delete(socketId);
        }

        // Always emit disconnection event so clients can verify current state
        io.emit("user_disconnected", userId);

        // If this was the last connection, explicitly notify all conversations this user was in
        if (count <= 1) {
            // Find all conversations this user was in and notify them
            (async () => {
                try {
                    const participants = await Participant.findAll({
                        where: { userId },
                        attributes: ['conversationId']
                    });

                    const conversationIds = participants.map(p => p.conversationId);
                    console.log(`Notifying all ${conversationIds.length} conversations that user ${userId} is now offline`);

                    conversationIds.forEach(convoId => {
                        io.to(convoId).emit('user_status_changed', { userId, online: false });
                    });
                } catch (err) {
                    console.error('Error notifying conversations of user disconnect:', err);
                }
            })();
        }

        logState(`USER_DISCONNECTED:${userId}`);
    }
};
