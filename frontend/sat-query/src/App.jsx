import React, { useState } from 'react';
import './App.css';
import ImageAnnotator from './components/ImageAnnotator';
import ExecutionBadge from './components/ExecutionBadge';
import { 
  Orbit, 
  Plus, 
  MessageSquare, 
  Images, 
  Bookmark, 
  PanelLeftClose, 
  PanelLeftOpen,
  Menu,
  Share2, 
  HelpCircle, 
  ArrowUp, 
  ArrowUpRight, 
  Waves, 
  Sprout, 
  Building2, 
  Flame, 
  ChevronDown,
  Layers
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  { title: "Detect water change", desc: "Compare shoreline or flood extent across dates", icon: Waves },
  { title: "Assess vegetation health", desc: "Highlight stressed crops using visible patterns", icon: Sprout },
  { title: "Find new development", desc: "Identify recent construction and road growth", icon: Building2 },
  { title: "Map burn severity", desc: "Estimate wildfire impact and affected area", icon: Flame }
];

export default function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  
  // Real sessions
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Responsive Sidebar Visibility State
  // Desktop: open by default (true). Mobile: closed by default (false on small screens).
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    const urls = selected.map(file => URL.createObjectURL(file));
    setPreviews(urls);
  };

  const handleNewAnalysis = () => {
    setChatHistory([]);
    setFiles([]);
    setPreviews([]);
    setPrompt("");
    setActiveSessionId(null);
    closeSidebarOnMobile();
  };

  const handleSend = async (overridePrompt) => {
    const activePrompt = overridePrompt || prompt;
    if (!activePrompt.trim() && files.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("prompt", activePrompt);
    files.forEach(f => formData.append("files", f));

    const currentPreviews = [...previews];
    const userMessage = { role: 'user', text: activePrompt, images: currentPreviews };
    
    setChatHistory(prev => [...prev, userMessage]);
    setPrompt("");

    if (!activeSessionId) {
      const newId = Date.now().toString();
      setActiveSessionId(newId);
      setSessions(prev => [
        { id: newId, title: activePrompt.slice(0, 26) + (activePrompt.length > 26 ? "..." : "") },
        ...prev
      ]);
    }

    try {
      const res = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: data.markdown_content,
        trace: data.execution_trace,
        boxes: data.bounding_boxes,
        annotatedImage: currentPreviews[0] || null
      }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: "Error analyzing satellite imagery. Please check your FastAPI backend."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div>
          <div className="brand-header">
            <div className="brand-meta">
              <div className="brand-icon">
                <Orbit size={18} />
              </div>
              <span className="brand-title"><span>Gaganasakhi</span></span>
            </div>
            <button onClick={toggleSidebar} className="sidebar-collapse-btn" title="Close sidebar">
              <PanelLeftClose size={18} />
            </button>
          </div>

          <button onClick={handleNewAnalysis} className="new-analysis-btn">
            <div className="btn-content">
              <Plus size={16} />
              <span>New analysis</span>
            </div>
          </button>

          <nav className="nav-menu">
            <button onClick={handleNewAnalysis} className="nav-link active">
              <MessageSquare size={16} />
              <span>New chat</span>
            </button>
          </nav>

          <div className="recent-section">
            <p className="recent-label">Recent</p>
            {sessions.length === 0 ? (
              <p className="empty-history-text">No analyses yet</p>
            ) : (
              sessions.map(s => (
                <div 
                  key={s.id} 
                  className="recent-item" 
                  onClick={() => { setActiveSessionId(s.id); closeSidebarOnMobile(); }}
                >
                  <span className="truncate">{s.title}</span>
                  {s.id === activeSessionId && <span className="status-dot"></span>}
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport">
        
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="title-group">
            {/* Sidebar Toggle Button (shows if sidebar is collapsed on desktop, or always available on mobile) */}
            <button 
              onClick={toggleSidebar} 
              className="sidebar-toggle-btn" 
              title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={16} /> : <Menu size={16} />}
            </button>
            <span className="page-title">New satellite analysis</span>
            <span className="draft-pill">DRAFT</span>
          </div>
          <div className="action-group">
            <span className="crs-badge">
              <span className="status-dot"></span> EPSG:4326 ready
            </span>
            <button className="icon-btn" title="Help">
              <HelpCircle size={15} />
            </button>
            <button className="share-btn">
              <Share2 size={13} />
              <span>Share</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="chat-container">
          {chatHistory.length === 0 ? (
            /* Zero-State */
            <div className="zero-state">
              <div className="hero-icon">
                <Orbit size={24} />
              </div>
              <h1 className="hero-heading">
                Talk to your <span>Satellite</span> data
              </h1>
              <p className="hero-subtitle">
                Upload imagery, ask a question, and get grounded geospatial insight with clear visual evidence.
              </p>

              {/* Upload Dropzone */}
              <div className="upload-card">
                <div className="upload-left">
                  <div className="upload-preview-box">
                    {previews[0] ? (
                      <img src={previews[0]} alt="Upload preview" />
                    ) : (
                      <Layers size={24} />
                    )}
                  </div>
                  <div className="upload-text">
                    <h4>Upload satellite imagery</h4>
                    <p>Drop a GeoTIFF, JPEG, or PNG here. Files up to 250 MB.</p>
                    <span className="upload-tag">Geo-referenced files supported</span>
                  </div>
                </div>
                <label className="browse-btn">
                  Browse files
                  <input type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          ) : (
            /* Active Thread */
            <div>
              {chatHistory.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role}`}>
                  {msg.role === 'user' ? (
                    <div className="user-bubble">
                      {msg.images && msg.images.length > 0 && (
                        <div className="user-thumbnails">
                          {msg.images.map((img, idx) => (
                            <img key={idx} src={img} alt="Thumbnail preview" />
                          ))}
                        </div>
                      )}
                      <p>{msg.text}</p>
                    </div>
                  ) : (
                    <div>
                      <ExecutionBadge trace={msg.trace} />
                      {msg.boxes && msg.boxes.length > 0 && msg.annotatedImage && (
                        <ImageAnnotator imageSrc={msg.annotatedImage} boxes={msg.boxes} />
                      )}
                      <div className="assistant-body">{msg.text}</div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="loading-indicator">
                  <span className="status-dot"></span>
                  SatQuery agent executing specialist workflow...
                </div>
              )}
            </div>
          )}

          {/* Bottom Dock */}
          <div className="bottom-dock">
            <div className="input-box">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything about your image..."
              />
              <div className="input-toolbar">
                <div className="toolbar-chips">
                  <label className="add-file-btn" title="Add satellite files">
                    <Plus size={16} />
                    <input type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                  <span className="chip-btn">
                    <Layers size={13} />
                    {files.length > 0 ? `${files.length} file(s)` : 'Satellite image'}
                  </span>
                  <span className="chip-btn">
                    Analyze <ChevronDown size={13} />
                  </span>
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleSend()}
                  className="send-btn"
                  title="Run Query"
                >
                  <ArrowUp size={16} />
                </button>
              </div>
            </div>

            {chatHistory.length === 0 && (
              <div>
                <p className="query-grid-title">Try a geospatial query</p>
                <div className="query-grid">
                  {SUGGESTED_QUERIES.map((q, idx) => {
                    const IconComponent = q.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSend(q.title + ": " + q.desc)}
                        className="query-card"
                      >
                        <div className="query-card-icon">
                          <IconComponent size={18} />
                        </div>
                        <div className="query-card-content">
                          <div className="query-card-header">
                            <h4 className="query-card-title">{q.title}</h4>
                            <ArrowUpRight size={14} className="query-card-arrow" />
                          </div>
                          <p className="query-card-desc">{q.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}