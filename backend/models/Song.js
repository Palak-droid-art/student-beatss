const mongoose = require('mongoose');

// NEW: Sub-schema for individual comments
const commentSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  category: {
    type: String,
    enum: ['Lo-Fi Study', 'Focus & Coding', 'Sufi & Soul', 'Chill Vibes', 'Upbeat'],
    default: 'Lo-Fi Study',
  },
  coverUrl: { type: String, required: true },
  audioUrl: { type: String, required: true },
  isLiked: { type: Boolean, default: false },
  // NEW: Array of comments stored permanently inside the song document
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Song', songSchema);