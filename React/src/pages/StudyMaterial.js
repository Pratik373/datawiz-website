import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ProfileDropdown from '../components/ProfileDropdown'

export default function StudyMaterial() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [search, setSearch] = useState('')
  const [activePdf, setActivePdf] = useState(null) // { url, title }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    setError('')

    const response = await fetch('/api/study-materials')
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(payload.error || 'Could not load study materials.')
      setMaterials([])
      setLoading(false)
      return
    }

    const files = (payload.materials || [])
      .filter((file) => file.name && file.name !== '.emptyFolderPlaceholder' && !file.name.endsWith('/'))
      .map((file) => {
        return {
          name: file.name,
          title: formatTitle(file.name),
          desc: 'PDF study material from the DataWiz C-CAT resource library.',
          size: formatSize(file.size),
          section: inferSection(file.name),
        }
      })

    setMaterials(files)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  const handleMaterialAction = async (material, download = false) => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/study-material')
      navigate('/login')
      return
    }

    const actionKey = `${material.name}:${download ? 'download' : 'view'}`
    setActionLoading(actionKey)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/study-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ fileName: material.name, download }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.setItem('redirectAfterLogin', '/study-material')
          navigate('/login')
          return
        }
        throw new Error(payload.error || 'Could not open this material.')
      }

      if (download) {
        window.open(payload.url, '_blank', 'noopener,noreferrer')
      } else {
        setActivePdf({ url: payload.url, title: material.title })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading('')
    }
  }

  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.desc.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant">
        <div className="flex justify-between items-center px-gutter py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-md">
            <button onClick={() => navigate('/')} className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Home
            </button>
          </div>
          <ProfileDropdown user={user} navigate={navigate} />
        </div>
      </header>

      <main className="mt-[72px] flex-grow">
        <section className="max-w-container-max mx-auto px-gutter py-lg text-center md:text-left">
          <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-label-md text-label-md mb-md">
            CDAC C-CAT Resources
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-sm">Study Materials</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Download or view PDFs for C-CAT prep. Materials are loaded live from the DataWiz resource library.
          </p>
        </section>

        <section className="max-w-container-max mx-auto px-gutter mb-lg">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full pl-[56px] pr-md py-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Search by book title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {loading ? (
          <section className="flex flex-col items-center justify-center py-xl px-gutter text-center">
            <div className="w-48 h-48 bg-surface-container rounded-full flex items-center justify-center mb-md">
              <span className="material-symbols-outlined text-[80px] text-outline-variant">hourglass_empty</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Loading materials</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">Fetching PDFs from Supabase Storage...</p>
          </section>
        ) : error ? (
          <section className="flex flex-col items-center justify-center py-xl px-gutter text-center">
            <div className="w-48 h-48 bg-surface-container rounded-full flex items-center justify-center mb-md">
              <span className="material-symbols-outlined text-[80px] text-outline-variant">cloud_off</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Could not load materials</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-lg">{error}</p>
            <button onClick={fetchMaterials} className="text-primary font-label-md text-label-md hover:underline">Try again</button>
          </section>
        ) : filtered.length > 0 ? (
          <section className="max-w-container-max mx-auto px-gutter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md pb-xl">
            {filtered.map((material) => (
              <div key={material.name} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col h-full"
                style={{ transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0px 4px 12px rgba(44, 44, 42, 0.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                <div className="flex justify-between items-start mb-md">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-md text-label-md text-xs uppercase tracking-wider">PDF</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">{material.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">{material.desc}</p>
                <div className="mt-auto flex flex-col gap-sm">
                  <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant mb-xs">
                    <span>File Size: {material.size || 'Unknown'}</span>
                    <span>{material.section}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <button
                      type="button"
                      onClick={() => handleMaterialAction(material, false)}
                      disabled={Boolean(actionLoading)}
                      className="flex items-center justify-center gap-xs py-2 border border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary/5 transition-colors"
                    >
                      {actionLoading === `${material.name}:view` ? 'Opening...' : 'View'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMaterialAction(material, true)}
                      disabled={Boolean(actionLoading)}
                      className="flex items-center justify-center gap-xs py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      {actionLoading === `${material.name}:download` ? 'Opening...' : 'Download'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="flex flex-col items-center justify-center py-xl px-gutter text-center">
            <div className="w-48 h-48 bg-surface-container rounded-full flex items-center justify-center mb-md">
              <span className="material-symbols-outlined text-[80px] text-outline-variant">folder_open</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">No materials found</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-lg">We couldn't find any resources matching your search. Try adjusting your keywords.</p>
            <button onClick={() => setSearch('')} className="text-primary font-label-md text-label-md hover:underline">Clear search filters</button>
          </section>
        )}
      </main>

      <footer className="bg-surface-container-low border-t border-outline-variant w-full py-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md px-gutter max-w-container-max mx-auto">
          <div className="flex flex-col gap-xs">
            <div className="font-headline-sm text-headline-sm font-bold text-primary">DataWiz</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">&copy; 2026 DataWiz. CDAC C-CAT Exam Prep Platform.</p>
          </div>
          <div className="flex flex-wrap gap-md md:justify-end">
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Terms of Service</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Contact Us</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">FAQ</button>
          </div>
        </div>
      </footer>

      {/* Fullscreen PDF Viewer Modal */}
      {activePdf && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-container-lowest animate-fade-in" style={{ animationDuration: '0.2s' }}>
          {/* Header */}
          <header className="flex justify-between items-center px-gutter py-4 bg-surface/85 backdrop-blur-xl border-b border-outline-variant shadow-sm">
            <div className="flex items-center gap-md min-w-0">
              <button
                onClick={() => setActivePdf(null)}
                className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-all active:scale-95 cursor-pointer font-label-md text-label-md shrink-0"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Close Reader</span>
              </button>
              <div className="h-6 w-[1px] bg-outline-variant mx-1 shrink-0" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate pr-md font-bold">
                {activePdf.title}
              </h2>
            </div>
            <div className="flex items-center gap-sm shrink-0">
              <button
                onClick={() => window.open(activePdf.url, '_blank')}
                className="flex items-center gap-xs px-4 py-2 border border-primary text-primary rounded-full hover:bg-primary/5 active:scale-95 transition-all text-xs font-bold font-label-md"
                title="Open in new tab"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span className="hidden sm:inline">New Tab</span>
              </button>
              <button
                onClick={() => setActivePdf(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
                aria-label="Close reader"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </header>

          {/* PDF Frame Container */}
          <div className="flex-grow w-full h-full bg-[#525659] flex items-center justify-center relative">
            <iframe
              src={`${activePdf.url}#toolbar=1`}
              title={activePdf.title}
              className="w-full h-full border-none"
              allow="autoplay"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function formatTitle(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatSize(bytes) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.ceil(bytes / 1024)} KB`
}

function inferSection(fileName) {
  const text = fileName.toLowerCase()
  if (text.includes('aptitude') || text.includes('english') || text.includes('reasoning') || text.includes('quicker')) {
    return 'Section A'
  }
  if (text.includes('computer') || text.includes('data') || text.includes('operating') || text.includes('digital') || text.includes('microprocessor') || text.includes(' c ')) {
    return 'Section B'
  }
  return 'PDF'
}
