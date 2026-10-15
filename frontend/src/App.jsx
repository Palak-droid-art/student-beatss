import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Play, Pause, SkipForward, SkipBack, Plus, Search,
  Music, Heart, Trash2, Timer, RotateCcw, Volume2, Upload,
  Shuffle, Repeat, User, LogOut, Video, Sun, Moon, MessageSquare, Send, ExternalLink
} from 'lucide-react';
import './App.css';

const API_URL = "https://student-beats.onrender.com/api/songs";
const AUTH_URL = "https://student-beats.onrender.com/api/auth";

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeYouTubeModalId, setActiveYouTubeModalId] = useState(null);

  const [theme, setTheme] = useState('dark');
  const [activeCommentSongId, setActiveCommentSongId] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepTimerActive, setSleepTimerActive] = useState(false);
  
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('student_todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodoText, setNewTodoText] = useState('');
  const [showTodoPad, setShowTodoPad] = useState(false);

  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const [uploadType, setUploadType] = useState('youtube');
  const [selectedFile, setSelectedFile] = useState(null);
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    category: 'Lo-Fi Study',
    coverUrl: '',
    audioUrl: ''
  });

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState('Focus');

  const audioRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    fetchSongs();
    const savedUser = localStorage.getItem('student_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    return () => clearTimeout(timer);
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await axios.get(API_URL);
      setSongs(res.data);
      if (res.data.length > 0 && !currentSong) setCurrentSong(res.data[0]);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLoginMode ? `${AUTH_URL}/login` : `${AUTH_URL}/register`;
      const res = await axios.post(endpoint, authForm);
      localStorage.setItem('student_token', res.data.token);
      localStorage.setItem('student_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setShowAuthModal(false);
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    setUser(null);
  };

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      if (timerMode === 'Focus') {
        alert('🎉 25-Min Study Session Complete! Taking a 5-minute break.');
        setTimerMode('Break');
        setTimeLeft(5 * 60);
      } else {
        alert('⚡ Break Over! Ready for another focus session?');
        setTimerMode('Focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerMode]);

  useEffect(() => {
    let timer = null;
    if (sleepTimerActive && sleepMinutes > 0) {
      timer = setInterval(() => {
        setSleepMinutes((prev) => {
          if (prev <= 1) {
            setSleepTimerActive(false);
            setIsPlaying(false);
            alert('🌙 Sleep Timer ended. Music paused.');
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    }
    return () => clearInterval(timer);
  }, [sleepTimerActive, sleepMinutes]);

  useEffect(() => {
    localStorage.setItem('student_todos', JSON.stringify(todos));
  }, [todos]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(timerMode === 'Focus' ? 25 * 60 : 5 * 60);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play();
    else audioRef.current.pause();
  }, [isPlaying, currentSong]);

  const playSelectedSong = (song) => {
    const ytId = getYouTubeId(song.audioUrl);
    if (ytId) {
      setActiveYouTubeModalId(song._id);
      setCurrentSong(song);
      setIsPlaying(false);
      return;
    }

    if (currentSong?._id === song._id) {
      setIsPlaying(!isPlaying);
    } else {
      setProgress(0);
      setCurrentTime(0);
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (!songs.length) return;
    const mp3Songs = songs.filter(s => !getYouTubeId(s.audioUrl));
    if (!mp3Songs.length) return;
    const currentIndex = mp3Songs.findIndex((s) => s._id === currentSong?._id);
    const nextIndex = (currentIndex + 1) % mp3Songs.length;
    setCurrentSong(mp3Songs[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!songs.length) return;
    const mp3Songs = songs.filter(s => !getYouTubeId(s.audioUrl));
    if (!mp3Songs.length) return;
    const currentIndex = mp3Songs.findIndex((s) => s._id === currentSong?._id);
    const prevIndex = (currentIndex - 1 + mp3Songs.length) % mp3Songs.length;
    setCurrentSong(mp3Songs[prevIndex]);
    setIsPlaying(true);
  };

  const handleSongEnd = () => {
    if (isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      handleNext();
    }
  };

  const togglePlaylist = async (songId) => {
    try {
      const res = await axios.patch(`${API_URL}/${songId}/like`);
      setSongs(songs.map((s) => (s._id === songId ? res.data : s)));
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  };

  const handleAddComment = async (songId, e) => {
    e.preventDefault();
    if (!user) return alert('Please login first to leave a review!');
    if (!newCommentText.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/${songId}/comments`, {
        userName: user.name,
        text: newCommentText
      });
      setSongs(songs.map((s) => (s._id === songId ? res.data : s)));
      setNewCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodoText, completed: false }]);
    setNewTodoText('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  // AUTOMATIC TITLE, ARTIST & COVER FETCHER FROM YOUTUBE
  const handleYouTubeUrlChange = async (url) => {
    const foundId = getYouTubeId(url);
    if (!foundId) {
      setNewSong({ ...newSong, audioUrl: url });
      return;
    }

    const autoCover = `https://img.youtube.com/vi/${foundId}/hqdefault.jpg`;
    
    setNewSong({
      ...newSong,
      audioUrl: url,
      coverUrl: autoCover,
      title: "Detecting song name...",
      artist: "Detecting artist..."
    });

    try {
      const res = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${foundId}&format=json`);
      if (res.data) {
        let cleanTitle = res.data.title || "";
        let cleanAuthor = res.data.author_name || "";
        cleanTitle = cleanTitle.replace(/.*?|⟨.*?⟩|\(.*?\)|\|.*|Official Video|Song|Full Audio|HD/gi, "").trim();

        setNewSong({
          ...newSong,
          audioUrl: url,
          coverUrl: autoCover,
          title: cleanTitle || "YouTube Song",
          artist: cleanAuthor || "Various Artists"
        });
      }
    } catch (err) {
      setNewSong({
        ...newSong,
        audioUrl: url,
        coverUrl: autoCover,
        title: "Study Track",
        artist: "YouTube Stream"
      });
    }
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (uploadType === 'file') {
        if (!selectedFile) return alert('Please select an MP3 file!');
        const formData = new FormData();
        formData.append('title', newSong.title);
        formData.append('artist', newSong.artist);
        formData.append('category', newSong.category);
        formData.append('coverUrl', newSong.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80');
        formData.append('audioFile', selectedFile);

        res = await axios.post(`${API_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const foundId = getYouTubeId(newSong.audioUrl);
        const cleanAudioUrl = foundId ? `https://www.youtube.com/watch?v=${foundId}` : newSong.audioUrl;
        const finalCover = newSong.coverUrl || (foundId ? `https://img.youtube.com/vi/${foundId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80');

        res = await axios.post(API_URL, { 
          ...newSong, 
          audioUrl: cleanAudioUrl,
          coverUrl: finalCover 
        });
      }

      setSongs([res.data, ...songs]);
      setShowAddModal(false);
      setSelectedFile(null);
      setNewSong({ title: '', artist: '', category: 'Lo-Fi Study', coverUrl: '', audioUrl: '' });
    } catch (error) {
      alert('Failed to add track.');
    }
  };

  const handleDeleteSong = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setSongs(songs.filter((s) => s._id !== id));
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const updateMp3Progress = () => {
    const dur = audioRef.current?.duration;
    const cur = audioRef.current?.currentTime;
    if (dur && cur) {
      setCurrentTime(cur);
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e) => {
    const width = e.currentTarget.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const dur = audioRef.current?.duration;
    if (dur) {
      audioRef.current.currentTime = (clickX / width) * dur;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const likedCount = songs.filter((s) => s.isLiked).length;

  const filteredSongs = songs.filter((song) => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'My Playlist') return matchesSearch && song.isLiked;
    const matchesCategory = selectedCategory === 'All' || song.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Lo-Fi Study', 'Focus & Coding', 'Sufi & Soul', 'Chill Vibes', 'Upbeat', 'My Playlist'];
  const activeSongData = songs.find(s => s._id === activeYouTubeModalId);
  const activeYTId = getYouTubeId(activeSongData?.audioUrl);

  return (
    <div className={`app-container-root ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
      
      {showSplash && (
        <div className="splash-screen">
          <div className="splash-content">
            <div className="splash-logo-circle">
              <Music size={52} color="#c084fc" />
            </div>
            <h1 className="splash-title">StudentBeats</h1>
            <div className="splash-name-container">
              <span className="splash-name">~by palak sharma</span>
            </div>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src={currentSong?.audioUrl && !getYouTubeId(currentSong.audioUrl) ? currentSong.audioUrl : undefined}
        onTimeUpdate={updateMp3Progress}
        onLoadedMetadata={updateMp3Progress}
        onEnded={handleSongEnd}
      />

      {activeYouTubeModalId && activeYTId && (
        <div className="modal-backdrop">
          <div className="youtube-modal-card">
            <div className="yt-modal-header">
              <div className="yt-modal-song-info">
                <h3>{activeSongData?.title}</h3>
                <p>{activeSongData?.artist}</p>
              </div>
              <button className="yt-close-btn" onClick={() => setActiveYouTubeModalId(null)}>✕</button>
            </div>
            <div className="yt-iframe-wrapper">
              <iframe
                width="100%"
                height="320"
                src={`https://www.youtube.com/embed/${activeYTId}?autoplay=1&modestbranding=1&rel=0`}
                title={activeSongData?.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <div className="app-container">
        <header className="navbar">
          <div className="logo">
            <Music size={28} color="#a855f7" />
            <h1>Student<span>Beats</span></h1>
            <span className="badge">Study & Music Hub</span>
          </div>

          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="pomodoro-widget">
            <Timer size={18} color="#c084fc" />
            <span className="timer-mode">{timerMode}:</span>
            <span className="timer-clock">{formatTime(timeLeft)}</span>
            <button className="timer-btn" onClick={() => setTimerActive(!timerActive)}>
              {timerActive ? 'Pause' : 'Start'}
            </button>
            <button className="timer-reset" onClick={resetTimer} title="Reset Timer">
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="nav-actions">
            <button className="todo-toggle-btn" onClick={() => setShowTodoPad(!showTodoPad)} title="Study To-Do Pad">
              📝 To-Do ({todos.filter(t => !t.completed).length})
            </button>

            <button
              className="theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} color="#facc15" /> : <Moon size={18} color="#475569" />}
            </button>

            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Track
            </button>

            {user ? (
              <div className="user-pill">
                <span>👋 Hi, {user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="logout-btn" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button className="auth-btn" onClick={() => setShowAuthModal(true)}>
                <User size={16} /> Login
              </button>
            )}
          </div>
        </header>

        <div className="categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'My Playlist' ? `❤️ My Playlist (${likedCount})` : cat}
            </button>
          ))}
        </div>

        <main className="song-grid">
          {filteredSongs.length === 0 ? (
            <p className="empty-msg">No tracks found!</p>
          ) : (
            filteredSongs.map((song) => {
              const isCurrent = currentSong?._id === song._id;
              const isYT = Boolean(getYouTubeId(song.audioUrl));
              const commentCount = song.comments ? song.comments.length : 0;

              return (
                <div key={song._id} className={`song-card ${isCurrent ? 'active-card' : ''}`}>
                  <div className="cover-wrapper" onClick={() => playSelectedSong(song)}>
                    <img src={song.coverUrl} alt={song.title} />
                    {isYT && <span className="yt-badge">▶ In-App Play</span>}
                    <div className="play-overlay">
                      <Play size={32} />
                    </div>
                  </div>

                  <div className="song-info">
                    <span className="song-cat">{song.category}</span>
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                  </div>

                  <div className="card-actions">
                    <button
                      className={`icon-btn ${song.isLiked ? 'liked' : ''}`}
                      onClick={() => togglePlaylist(song._id)}
                      title="Save to Playlist"
                    >
                      <Heart size={18} fill={song.isLiked ? '#ec4899' : 'none'} />
                    </button>

                    <button
                      className="icon-btn comment-toggle-btn"
                      onClick={() => setActiveCommentSongId(activeCommentSongId === song._id ? null : song._id)}
                      title="Study Reviews"
                    >
                      <MessageSquare size={16} /> {commentCount}
                    </button>

                    <button
                      className="icon-btn delete"
                      onClick={() => handleDeleteSong(song._id)}
                      title="Delete Track"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {activeCommentSongId === song._id && (
                    <div className="comments-drawer">
                      <div className="comments-list">
                        {song.comments && song.comments.length > 0 ? (
                          song.comments.map((c, idx) => (
                            <div key={idx} className="comment-item">
                              <strong>{c.userName}:</strong> <span>{c.text}</span>
                            </div>
                          ))
                        ) : (
                          <p className="no-comments">No reviews yet. Be the first!</p>
                        )}
                      </div>
                      <form onSubmit={(e) => handleAddComment(song._id, e)} className="comment-form">
                        <input
                          type="text"
                          placeholder="Add study review..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                        />
                        <button type="submit"><Send size={12} /></button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>

      {showTodoPad && (
        <div className="todo-drawer">
          <div className="todo-header">
            <h3>📝 Study & Coding Tasks</h3>
            <button onClick={() => setShowTodoPad(false)}>×</button>
          </div>
          <form onSubmit={handleAddTodo} className="todo-form">
            <input
              type="text"
              placeholder="Add task (e.g., Revise DBMS)..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
          <div className="todo-list">
            {todos.length === 0 ? (
              <p className="no-todos">No pending tasks for today!</p>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
                  <button onClick={() => deleteTodo(todo.id)}>🗑️</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>{isLoginMode ? 'Student Login' : 'Create Student Account'}</h2>
            <form onSubmit={handleAuthSubmit}>
              {!isLoginMode && (
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
              <div className="modal-btns">
                <button type="button" className="cancel-btn" onClick={() => setShowAuthModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">{isLoginMode ? 'Login' : 'Sign Up'}</button>
              </div>
            </form>
            <p className="switch-auth" onClick={() => setIsLoginMode(!isLoginMode)}>
              {isLoginMode ? "New student? Create an account" : "Already have an account? Login"}
            </p>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Add Track for Students</h2>
            <div className="upload-tabs">
              <button className={uploadType === 'youtube' ? 'active-tab' : ''} onClick={() => setUploadType('youtube')}>▶ YouTube</button>
              <button className={uploadType === 'file' ? 'active-tab' : ''} onClick={() => setUploadType('file')}>MP3 File</button>
              <button className={uploadType === 'url' ? 'active-tab' : ''} onClick={() => setUploadType('url')}>MP3 URL</button>
            </div>
            <form onSubmit={handleAddSong}>
              {uploadType === 'youtube' && (
                <div className="youtube-auto-group">
                  <input
                    type="url"
                    placeholder="Paste YouTube URL"
                    required
                    value={newSong.audioUrl}
                    onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                  />
                  <small style={{ color: '#c084fc', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>✨ Title & Artist auto-detects!</small>
                </div>
              )}
              <input
                type="text"
                placeholder="Song Title (Auto-filled)"
                required
                value={newSong.title}
                onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Artist Name (Auto-filled)"
                required
                value={newSong.artist}
                onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
              />
              <select value={newSong.category} onChange={(e) => setNewSong({ ...newSong, category: e.target.value })}>
                <option value="Lo-Fi Study">Lo-Fi Study</option>
                <option value="Focus & Coding">Focus & Coding</option>
                <option value="Sufi & Soul">Sufi & Soul</option>
                <option value="Chill Vibes">Chill Vibes</option>
                <option value="Upbeat">Upbeat</option>
              </select>
              <input
                type="url"
                placeholder="Cover Image URL (Auto-filled)"
                value={newSong.coverUrl}
                onChange={(e) => setNewSong({ ...newSong, coverUrl: e.target.value })}
              />
              {uploadType === 'file' && (
                <div className="file-input-box">
                  <label>Select .mp3 file:</label>
                  <input type="file" accept="audio/*" required onChange={(e) => setSelectedFile(e.target.files[0])} />
                </div>
              )}
              {uploadType === 'url' && (
                <input
                  type="url"
                  placeholder="Direct MP3 Audio URL"
                  required
                  value={newSong.audioUrl}
                  onChange={(e) => setNewSong({ ...newSong, audioUrl: e.target.value })}
                />
              )}
              <div className="modal-btns">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Add Song</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!activeYouTubeModalId && currentSong && (
        <footer className="player-bar">
          <div className="now-playing">
            <img src={currentSong.coverUrl} alt={currentSong.title} />
            <div>
              <h4>{currentSong.title}</h4>
              <p>{currentSong.artist}</p>
            </div>
          </div>

          <div className="player-controls">
            <div className="control-buttons">
              <button className={isShuffle ? 'mode-active' : ''} onClick={() => setIsShuffle(!isShuffle)} title="Shuffle">
                <Shuffle size={18} />
              </button>
              <button onClick={handlePrev}><SkipBack size={22} /></button>
              <button className="play-main" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={handleNext} style={{background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer'}}>
                <SkipForward size={22} />
              </button>
              <button className={isRepeat ? 'mode-active' : ''} onClick={() => setIsRepeat(!isRepeat)} title="Repeat">
                <Repeat size={18} />
              </button>
            </div>

            <div className="timeline-row">
              <span className="time-label">{formatTime(currentTime)}</span>
              <div className="progress-container" onClick={handleSeek}>
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="time-label">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="volume-controls">
            <div className="sleep-timer-container">
              <select 
                value={sleepMinutes} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSleepMinutes(val);
                  setSleepTimerActive(val > 0);
                }}
                className="sleep-select"
                title="Sleep Timer"
              >
                <option value={0}>🌙 Sleep: Off</option>
                <option value={15}>15m</option>
                <option value={30}>30m</option>
                <option value={60}>60m</option>
              </select>
            </div>

            <Volume2 size={18} color="#94a3b8" />
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange} className="volume-slider" />
          </div>
        </footer>
      )}
    </div>
  );
}