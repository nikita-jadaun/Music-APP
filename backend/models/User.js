const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number, default: 0 },
  uploader: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
}, { _id: false });

const PlaylistSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  tracks: [TrackSchema],
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  savedTracks: [TrackSchema],
  playlists: [PlaylistSchema],
  recentTracks: [TrackSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);

