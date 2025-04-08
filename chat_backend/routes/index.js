const express = require('express');
const router = express.Router();
const { Conversation, Message, Participant, sequelize } = require('../models');

// Create a conversation
router.post('/conversations', async (req, res) => {
  try {
    const { userIds } = req.body;
    const conversation = await Conversation.create();

    // Add participants
    await Participant.bulkCreate(
      userIds.map(userId => ({ userId, conversationId: conversation.id }))
    );

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all conversations for a user
router.get('/users/:userId/conversations', async (req, res) => {
  try {
    const { userId } = req.params;
    const participants = await Participant.findAll({
      where: { userId },
      include: { model: Conversation, as: 'conversation' }
    });
    const conversations = participants.map(p => p.conversation);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify the existence of a conversation with specific userIds
router.post('/conversations/verify', async (req, res) => {
  try {
    const { userIds } = req.body;

    // Find conversations where all userIds are participants
    const conversations = await Conversation.findAll({
      attributes: ['id', 'isGroupChat', 'createdAt'],
      include: [
        {
          model: Participant,
          as: 'participants',
          where: { userId: userIds },
          attributes: [],
          required: true,
        },
      ],
      group: ['Conversation.id'],
      having: sequelize.literal(`COUNT("participants"."id") = ${userIds.length}`),
    });

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'No conversation found with the specified users' });
    }

    res.json(conversations[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a conversation's messages
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.findAll({
      include: {
        model: Participant,
        as: "participant",
        where: {
          conversationId
        },
        include: {
          model: sequelize.models.AuthUser,
          as: 'user',
          attributes: ['id', 'username', 'first_name', 'last_name', 'email']
        }
      },
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const { content, userId, conversationId } = req.body;

    // Find the participant for this user/conversation
    const participant = await Participant.findOne({
      where: { userId, conversationId }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Create message linked to the participant
    const message = await Message.create({
      content,
      participantId: participant.id
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
