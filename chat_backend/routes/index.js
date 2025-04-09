const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Conversation, Message, Participant, sequelize, MessageAttachment } = require('../models');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const conversationId = req.params.conversationId;
    const dir = path.join(__dirname, '../uploads', `conversation-${conversationId}`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Extended file filter to match frontend supported file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',

    // Videos
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm',

    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm',

    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Text
    'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'application/xml',

    // Archives
    'application/zip', 'application/x-tar', 'application/x-rar-compressed', 'application/gzip',
    'application/x-7z-compressed',

    // Other common types
    'application/octet-stream',
    'application/x-executable',
    'application/vnd.android.package-archive'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Log the rejected file type for debugging
    console.log(`Rejected file type: ${file.mimetype} for file ${file.originalname}`);

    // For unknown file types that might be legitimate, we can check the extension
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExtensions = ['.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.doc', '.docx',
                           '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.7z', '.mp3',
                           '.mp4', '.avi', '.mov', '.webm', '.svg', '.json', '.xml', '.html',
                           '.css', '.js', '.apk', '.exe', '.dll', '.tar', '.gz'];

    if (safeExtensions.includes(ext)) {
      // Allow based on extension if mimetype wasn't recognized
      console.log(`Allowing file based on extension: ${ext}`);
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  }
};

// Configure upload with file size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

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
      include: [{
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
      {
        model: MessageAttachment,
        as: 'attachments',
      }],
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

// Delete a message
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find the message
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Delete any associated attachments from disk
    const attachments = await MessageAttachment.findAll({
      where: { messageId }
    });

    // Remove files from disk
    for (const attachment of attachments) {
      const filePath = path.join(__dirname, '../uploads', attachment.filePath);

      // Check if file exists before attempting to delete
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the message (and associated attachments due to cascade delete)
    await message.destroy();

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST endpoint for file uploads
router.post('/conversations/:conversationId/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageId } = req.body;

    // Ensure we have files and a message ID
    if (!req.files || !messageId) {
      return res.status(400).json({ error: 'Files and messageId are required' });
    }

    // Get the message to ensure it exists
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Create attachment records
    const attachments = await Promise.all(req.files.map(file => {
      return MessageAttachment.create({
        messageId: messageId,
        filename: file.originalname,
        filePath: path.relative(path.join(__dirname, '../uploads'), file.path),
        fileType: file.mimetype,
        fileSize: file.size
      });
    }));

    // Return the created attachments
    res.status(201).json({
      success: true,
      attachments: attachments
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to serve file attachments
router.get('/attachments/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;

    // Find the attachment
    const attachment = await MessageAttachment.findByPk(attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Construct the full path
    const filePath = path.join(__dirname, '../uploads', attachment.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set content type
    res.setHeader('Content-Type', attachment.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
