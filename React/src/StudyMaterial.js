import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './StudyMaterial.css';

const BUCKET = 'Study-Material';

export default function StudyMaterial() {
  const navigate = useNavigate();
  const [user, setUser]             = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [materials, setMaterials]   = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState('');
  const [viewingPdf, setViewingPdf] = useState(null); // { name, url }
  const [search, setSearch]         = useState('');

  /* ── Auth guard ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        sessionStorage.setItem('redirectAfterLogin', '/study-material');
        navigate('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        sessionStorage.setItem('redirectAfterLogin', '/study-material');
        navigate('/login');
      } else {
        setUser(session.user);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /* ── Fetch files from Supabase Storage ── */
  const fetchMaterials = useCallback(async () => {
    setFilesLoading(true);
    setFilesError('');
    try {
      console.log('[StudyMaterial] Listing bucket:', BUCKET);

      const { data, error } = await supabase.storage.from(BUCKET).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      console.log('[StudyMaterial] list() result:', JSON.stringify({ data, error }));

      if (error) {
        setFilesError(`Storage error: ${error.message}`);
        setFilesLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        // Try listing available buckets to debug
        const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
        console.log('[StudyMaterial] Available buckets:', JSON.stringify(buckets), JSON.stringify(bErr));
        setMaterials([]);
        setFilesLoading(false);
        return;
      }

      // Build public URL for each file
      const files = data
        .filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
        .map(f => {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
          console.log('[StudyMaterial] File:', f.name, '->', urlData.publicUrl);
          return {
            name: f.name,
            title: f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '),
            size: f.metadata?.size ? formatSize(f.metadata.size) : '',
            url: urlData.publicUrl,
          };
        });

      setMaterials(files);
    } catch (err) {
      console.error('[StudyMaterial] Unexpected error:', err);
      setFilesError(`Unexpected error: ${err.message}`);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMaterials();
    }
  }, [authLoading, user, fetchMaterials]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Auth loading ── */
  if (authLoading) {
    return (
      <div className="sm-loading">
        <div className="sm-spinner" />
        <p>Checking authentication…</p>
      </div>
    );
  }

  return (
    <div className="sm-root">
      {/* ── Navbar ── */}
      <nav className="sm-nav">
        <div className="sm-nav-inner">
          <button className="sm-back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <div className="sm-nav-right">
            <span className="sm-user-email">{user?.email}</span>
            <button className="sm-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* ── PDF Viewer Modal ── */}
      {viewingPdf && (
        <div className="sm-modal-overlay" onClick={() => setViewingPdf(null)}>
          <div className="sm-modal" onClick={e => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h3 className="sm-modal-title">{viewingPdf.title}</h3>
              <button className="sm-modal-close" onClick={() => setViewingPdf(null)}>✕</button>
            </div>
            <div className="sm-modal-body">
              <iframe
                src={viewingPdf.url}
                title={viewingPdf.title}
                className="sm-pdf-iframe"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="sm-header">
        <div className="sm-header-glow sm-glow-1" />
        <div className="sm-header-glow sm-glow-2" />
        <div className="sm-header-inner">
          <span className="sm-badge">📚 CDAC C-CAT Resources</span>
          <h1 className="sm-title">Study Materials</h1>
          <p className="sm-subtitle">
            All the books you need to crack C-CAT — view or download for free.
          </p>
          <div className="sm-search-wrap">
            <span className="sm-search-icon">🔍</span>
            <input
              className="sm-search-input"
              type="text"
              placeholder="Search books…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="sm-main">
        {filesLoading ? (
          <div className="sm-files-loading">
            <div className="sm-spinner" />
            <p>Loading books…</p>
          </div>
        ) : filesError ? (
          <div className="sm-error">
            <p>{filesError}</p>
            <button className="sm-retry-btn" onClick={fetchMaterials}>Try Again</button>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="sm-no-results">
            {search ? `No books match "${search}".` : 'No books available yet.'}
          </div>
        ) : (
          <>
            <p className="sm-count">{filteredMaterials.length} book{filteredMaterials.length !== 1 ? 's' : ''} available</p>
            <div className="sm-grid">
              {filteredMaterials.map(material => (
                <div key={material.name} className="sm-card">
                  <div className="sm-card-top">
                    <div className="sm-card-icon">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"
                          stroke="#88a3ff" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M7 7H17M7 11H17M7 15H13" stroke="#88a3ff" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="sm-card-category">PDF</span>
                  </div>
                  <h3 className="sm-card-title">{material.title}</h3>
                  {material.size && <p className="sm-card-size">📁 {material.size}</p>}
                  <div className="sm-card-actions">
                    <button
                      className="sm-btn-view"
                      onClick={() => setViewingPdf(material)}
                    >
                      👁 View
                    </button>
                    <a
                      className="sm-btn-download"
                      href={`${material.url}?download=`}
                      download={material.name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ⬇ Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="sm-footer">
        <p>© 2026 Datawiz6 · All rights reserved</p>
      </footer>
    </div>
  );
}

/* ── Helper ── */
function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}
