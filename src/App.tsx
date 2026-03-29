import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  LayoutGrid, 
  X,
  Send,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  History,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App = () => {
  // Initialize state from localStorage
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('social_planner_posts_v4');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load posts", e);
      return [];
    }
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid'); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('social_planner_dark_mode');
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  const [caption, setCaption] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state to localStorage whenever posts change
  useEffect(() => {
    try {
      localStorage.setItem('social_planner_posts_v4', JSON.stringify(posts));
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.error("Storage limit exceeded. The browser cannot store more data (usually 5MB limit).");
      }
    }
  }, [posts]);

  useEffect(() => {
    console.log('Dark mode changed:', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
      console.log('Added dark class to html');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class from html');
    }
    localStorage.setItem('social_planner_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'No Date Set';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const todayDate = new Date().toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    setCaption(post.caption || '');
    setScheduledDate(post.date || '');
    setPostUrl(post.url || '');
    setImagePreview(post.image);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    setPosts(posts.filter((p: any) => p.id !== deletingPostId));
    setDeletingPostId(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList) as File[];

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    };

    if (files.length > 1) {
      const newPosts = await Promise.all(
        files.map(async (file: File) => {
          const originalImage = await processFile(file);
          return {
            id: Date.now() + Math.random(),
            caption: '',
            date: '',
            url: '',
            image: originalImage,
            status: 'draft'
          };
        })
      );
      setPosts((prev: any) => [...prev, ...newPosts]);
    } else {
      const originalImage = await processFile(files[0]);
      setImagePreview(originalImage);
      setIsModalOpen(true);
    }
    e.target.value = '';
  };

  const getPostStatus = (date: string, url: string) => {
    if (url && url.trim() !== '') return 'published';
    if (!date) return 'draft';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) return 'today';
    if (targetDate < today) return 'late';
    return 'scheduled';
  };

  const handleSavePost = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const status = getPostStatus(scheduledDate, postUrl);

    const postData = {
      caption,
      date: scheduledDate,
      url: postUrl,
      image: imagePreview,
      status
    };

    if (editingPostId) {
      setPosts((prev: any) => prev.map((p: any) => p.id === editingPostId ? { ...p, ...postData } : p));
    } else {
      setPosts((prev: any) => [...prev, { id: Date.now(), ...postData }]);
    }
    handleCloseModal();
  };

  const setQuickDate = (dayOffset?: number) => {
    const date = new Date();
    if (dayOffset !== undefined) {
      const currentDay = date.getDay();
      let diff = dayOffset - currentDay;
      if (diff <= 0) diff += 7;
      date.setDate(date.getDate() + diff);
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
    setIsDatePickerOpen(false);
  };

  const renderDatePicker = () => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = Array.from({ length: firstDay }, (_, i) => ({ day: null })).concat(
      Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1 }))
    );

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
          onClick={() => setIsDatePickerOpen(false)} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-slate-100 dark:border-slate-800"
        >
          <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <span className="font-bold text-sm dark:text-white">{pickerMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => setPickerMonth(new Date(year, month - 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition dark:text-slate-400"><ChevronLeft size={16}/></button>
              <button type="button" onClick={() => setPickerMonth(new Date(year, month + 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition dark:text-slate-400"><ChevronRight size={16}/></button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center py-2 bg-white dark:bg-slate-900">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-[10px] font-bold text-slate-300 dark:text-slate-600">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 p-2 gap-1 bg-white dark:bg-slate-900">
            {calendarDays.map((dateObj: any, idx) => {
              const dateStr = dateObj.day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}` : null;
              const isSelected = scheduledDate === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!dateObj.day}
                  onClick={() => {
                    if (dateStr) {
                      setScheduledDate(dateStr);
                      setIsDatePickerOpen(false);
                    }
                  }}
                  className={`
                    h-8 w-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center
                    ${!dateObj.day ? 'invisible' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'}
                    ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white shadow-md shadow-indigo-100 dark:shadow-none' : 'text-slate-600 dark:text-slate-400'}
                    ${isToday && !isSelected ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}
                  `}
                >
                  {dateObj.day}
                </button>
              );
            })}
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button 
              type="button" 
              onClick={() => { setScheduledDate(''); setIsDatePickerOpen(false); }}
              className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 transition uppercase tracking-wider"
            >
              Clear
            </button>
            <button 
              type="button" 
              onClick={() => setIsDatePickerOpen(false)}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPostId(null);
    setCaption('');
    setScheduledDate('');
    setPostUrl('');
    setImagePreview(null);
  };

  const sortedPosts = [...posts].sort((a: any, b: any) => {
    const statusPriority: Record<string, number> = { 
      late: 0, 
      today: 1, 
      draft: 2, 
      scheduled: 3, 
      published: 4 
    };

    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }

    if (a.status === 'scheduled' || a.status === 'late') {
        return new Date(a.date || '9999-12-31').getTime() - new Date(b.date || '9999-12-31').getTime();
    }

    return b.id - a.id;
  });

  const getCardStyles = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800';
      case 'scheduled': return 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800';
      case 'today': return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800';
      case 'late': return 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 hover:border-red-200 dark:hover:border-red-800 ring-2 ring-red-50 dark:ring-red-900/20';
      default: return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400';
      case 'scheduled': return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400';
      case 'today': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 animate-pulse';
      case 'late': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400';
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = Array.from({ length: firstDay }, (_, i) => ({ day: null })).concat(
      Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1 }))
    );

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold dark:text-white">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition dark:text-slate-400"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition dark:text-slate-400">Today</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition dark:text-slate-400"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 min-h-[600px]">
          {calendarDays.map((dateObj: any, idx) => {
            const dateStr = dateObj.day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}` : null;
            const dayPosts = posts.filter((p: any) => p.date === dateStr);
            return (
              <div key={idx} className={`border-r border-b border-slate-100 dark:border-slate-800 p-2 min-h-[140px] group transition-colors ${!dateObj.day ? 'bg-slate-50/30 dark:bg-slate-950/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-semibold ${dateObj.day ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-700'}`}>{dateObj.day}</span>
                  {dateObj.day && (
                    <button onClick={() => { setScheduledDate(dateStr!); setIsModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition"><Plus size={14}/></button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dayPosts.map((post: any) => (
                    <button 
                      key={post.id} 
                      onDoubleClick={() => handleEditPost(post)}
                      onClick={() => handleEditPost(post)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 hover:scale-110 transition shadow-sm ${post.status === 'late' ? 'border-red-400' : 'border-indigo-100 dark:border-indigo-900'}`}
                    >
                      {post.image ? <img src={post.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><ImageIcon size={16} className="text-slate-300 dark:text-slate-600"/></div>}
                      {post.status === 'late' && <div className="absolute top-0 right-0 bg-red-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900"></div>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-10 font-sans transition-colors duration-300">
      <input 
        type="file" 
        hidden 
        ref={fileInputRef} 
        accept="image/*" 
        multiple 
        onChange={handleImageChange} 
      />
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Send className="text-indigo-600 dark:text-indigo-400 w-6 h-6"/>
          <span className="font-bold text-xl tracking-tight">SocialPlan</span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
          <CalendarIcon size={14} className="text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{todayDate}</span>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90 shadow-sm border border-slate-200 dark:border-slate-700"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Content Calendar</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Organize and schedule your upcoming posts</p>
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><LayoutGrid size={18}/></button>
            <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg transition ${viewMode === 'calendar' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><CalendarIcon size={18}/></button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {posts.length === 0 && viewMode === 'grid' ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center px-4"
            >
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-400 dark:text-indigo-500 mb-6">
                <ImageIcon size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">No posts planned yet</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                Start building your social media presence by creating your first post. Upload multiple images to create drafts instantly.
              </p>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition hover:scale-105 active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                <Plus size={20} />
                Create Your First Post
              </button>
            </motion.div>
          ) : viewMode === 'calendar' ? (
            <div key="calendar">{renderCalendar()}</div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="group bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center h-[318px] hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                  <Plus size={28} />
                </div>
                <span className="text-slate-800 dark:text-slate-100 font-bold">Plan New Post</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs mt-1">Select one or more images</span>
              </button>

              {sortedPosts.map((post: any) => (
                <motion.div 
                  layout
                  key={post.id} 
                  onDoubleClick={() => handleEditPost(post)}
                  className={`rounded-2xl border overflow-hidden shadow-sm group hover:shadow-md transition-all duration-300 cursor-pointer select-none ${getCardStyles(post.status)}`}
                >
                  <div className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {post.image && <img src={post.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" referrerPolicy="no-referrer" />}
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${getStatusStyles(post.status)}`}>
                      {post.status === 'late' && <History size={10} />}
                      {post.status === 'today' && <Clock size={10} />}
                      {post.status}
                    </div>
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleEditPost(post); }} className="p-2.5 bg-white dark:bg-slate-800 rounded-full hover:text-indigo-600 dark:hover:text-indigo-400 transition transform hover:scale-110 shadow-lg dark:text-slate-200" title="Edit Post"><Pencil size={18}/></button>
                      {post.url && (
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          className="p-2.5 bg-white dark:bg-slate-800 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition transform hover:scale-110 shadow-lg"
                          title="Open URL"
                        >
                          <ExternalLink size={18}/>
                        </a>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setDeletingPostId(post.id); }} className="p-2.5 bg-white dark:bg-slate-800 rounded-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition transform hover:scale-110 shadow-lg" title="Delete Post"><Trash2 size={18}/></button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
                        <CalendarIcon size={14} className={post.status === 'late' ? 'text-red-400' : 'text-indigo-400 dark:text-indigo-500'} />
                        {formatDisplayDate(post.date)}
                      </div>
                      {post.url && (
                        <div className="text-indigo-500 dark:text-indigo-400">
                          <ExternalLink size={14} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{post.caption || <span className="text-slate-300 dark:text-slate-600 italic">No caption provided...</span>}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {deletingPostId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setDeletingPostId(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10 p-6"
            >
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 dark:text-red-400 mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Delete Post?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">This post and its content will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingPostId(null)} className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-100 dark:shadow-none">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={handleCloseModal} 
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleSavePost} 
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{editingPostId ? 'Edit Planned Post' : 'New Post Details'}</h2>
                <button type="button" onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-full transition"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Publish Date</label>
                      <button 
                        type="button"
                        onClick={() => {
                          if (scheduledDate) {
                            const [y, m, d] = scheduledDate.split('-').map(Number);
                            setPickerMonth(new Date(y, m - 1));
                          } else {
                            setPickerMonth(new Date());
                          }
                          setIsDatePickerOpen(true);
                        }}
                        className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-700"
                      >
                        <span className={scheduledDate ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400 dark:text-slate-600 italic'}>
                          {scheduledDate ? formatDisplayDate(scheduledDate) : 'Select a date...'}
                        </span>
                        <CalendarIcon size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors" />
                      </button>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button 
                          type="button"
                          onClick={() => setQuickDate()}
                          className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition text-slate-500 dark:text-slate-400"
                        >
                          Today
                        </button>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                          <button 
                            key={day}
                            type="button"
                            onClick={() => setQuickDate((idx + 1) % 7)}
                            className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition text-slate-500 dark:text-slate-400"
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Post URL (Optional)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                          <ExternalLink size={14} />
                        </div>
                        <input 
                          type="url" 
                          placeholder="https://..." 
                          value={postUrl} 
                          onChange={e => setPostUrl(e.target.value)} 
                          className="w-full pl-9 p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-slate-50/30 dark:bg-slate-800/30 dark:text-white" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Caption</label>
                      <textarea placeholder="Write something engaging..." rows={4} value={caption} onChange={e => setCaption(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm resize-none bg-slate-50/30 dark:bg-slate-800/30 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Visual Media</label>
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-indigo-100 dark:border-indigo-900/30 rounded-2xl overflow-hidden cursor-pointer bg-indigo-50/10 dark:bg-indigo-900/10 flex flex-col items-center justify-center hover:bg-indigo-50/20 dark:hover:bg-indigo-900/20 transition-all group">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon size={40} className="text-indigo-200 dark:text-indigo-900/50 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-medium text-indigo-400 dark:text-indigo-600">Click to upload image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2">
                  {postUrl ? <CheckCircle2 size={18}/> : (scheduledDate ? <Clock size={18}/> : <Plus size={18}/>)}
                  {editingPostId ? 'Update Post' : (postUrl ? 'Mark as Published' : (scheduledDate ? 'Schedule Post' : 'Save as Draft'))}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDatePickerOpen && renderDatePicker()}
      </AnimatePresence>
    </div>
  );
};

export default App;
