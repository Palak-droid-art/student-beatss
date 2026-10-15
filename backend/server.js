const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Song = require('./models/Song');
const User = require('./models/User');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'student_beats_secret_key_2026';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Multer Storage for Local MP3 files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${cleanName}`);
  }
});
const upload = multer({ storage });

// MongoDB Connection & Seeding Your Custom Playlist
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_music_db';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully!');
    
    // Clear old tracks and insert your custom uploaded playlist tracks + previous evergreen hits
    await Song.deleteMany({});
    console.log('🧹 Old songs cleared from DB.');

    const myCustomPlaylist = [
      // --- Your Requested Playlist Links ---
      {
        title: "Yaaron Sab Dua Karo",
        artist: "Ram Shankar, Jaspal Mony",
        category: "Sufi & Soul",
        coverUrl: "https://img.youtube.com/vi/uWk-ivVWdMw/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=uWk-ivVWdMw"
      },
      {
        title: "Ishq Na Karna (Sad Medley)",
        artist: "Pop Chartbusters",
        category: "Sufi & Soul",
        coverUrl: "https://img.youtube.com/vi/4HEUDOIFdZw/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=4HEUDOIFdZw"
      },
      {
        title: "Aap Ki Kashish (Aashiq Banaya Aapne)",
        artist: "Himesh Reshammiya",
        category: "Upbeat",
        coverUrl: "https://img.youtube.com/vi/ruqcMNt2cQw/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=ruqcMNt2cQw"
      },
      {
        title: "Khali Dil Nahi Jaan Bhi (Kachche Dhaage)",
        artist: "Alka Yagnik, Hans Raj Hans",
        category: "Sufi & Soul",
        coverUrl: "https://img.youtube.com/vi/UaNTRKt0-1I/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=UaNTRKt0-1I"
      },
      // --- Previous Verified Hits ---
      {
        title: "Kun Faya Kun (Rockstar)",
        artist: "A.R. Rahman, Javed Ali",
        category: "Sufi & Soul",
        coverUrl: "https://img.youtube.com/vi/T94PHkuydcw/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=T94PHkuydcw"
      },
      {
        title: "Afreen Afreen (Coke Studio)",
        artist: "Rahat Fateh Ali Khan",
        category: "Sufi & Soul",
        coverUrl: "https://img.youtube.com/vi/kw4tT7SCmaY/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=kw4tT7SCmaY"
      },
      {
        title: "Tum Hi Ho (Aashiqui 2)",
        artist: "Arijit Singh",
        category: "Chill Vibes",
        coverUrl: "https://img.youtube.com/vi/Umqb9KENgmk/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=Umqb9KENgmk"
      },
      {
        title: "Kabira (Yeh Jawaani Hai Deewani)",
        artist: "Tochi Raina, Rekha Bhardwaj",
        category: "Sufi & Soul",
        coverUrl: "https://img.youtube.com/vi/jHNNMj5bNQw/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=jHNNMj5bNQw"
      },
      {
        title: "Channa Mereya (Ae Dil Hai Mushkil)",
        artist: "Arijit Singh",
        category: "Chill Vibes",
        coverUrl: "https://img.youtube.com/vi/284gA25SpDY/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=284gA25SpDY"
      },
      {
        title: "Late Night Lo-Fi Study Beats",
        artist: "Lofi Girl",
        category: "Lo-Fi Study",
        coverUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg",
        audioUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk"
      }
    ];

    await Song.insertMany(myCustomPlaylist);
    console.log('🎵 Palak\'s Custom Playlist Seeded Successfully!');
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    const savedUser = await newUser.save();

    const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: savedUser._id, name: savedUser.name, email: savedUser.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Student account not found!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials!' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- API ROUTES ---
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/songs', async (req, res) => {
  const { title, artist, category, coverUrl, audioUrl } = req.body;
  try {
    const newSong = new Song({ title, artist, category, coverUrl, audioUrl });
    const savedSong = await newSong.save();
    res.status(201).json(savedSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/songs/upload', upload.single('audioFile'), async (req, res) => {
  try {
    const { title, artist, category, coverUrl } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Please select an MP3 file' });

    const audioUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    const newSong = new Song({
      title,
      artist,
      category: category || 'Lo-Fi Study',
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      audioUrl
    });

    const savedSong = await newSong.save();
    res.status(201).json(savedSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/songs/:id/like', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });
    song.isLiked = !song.isLiked;
    const updatedSong = await song.save();
    res.json(updatedSong);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/songs/:id/comments', async (req, res) => {
  try {
    const { userName, text } = req.body;
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    song.comments.push({ userName, text });
    const updatedSong = await song.save();
    res.status(201).json(updatedSong);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/songs/:id', async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});