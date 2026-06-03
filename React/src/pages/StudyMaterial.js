import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const materials = [
  { title: 'Data Structures Mastery', desc: 'Comprehensive guide to trees, graphs, and algorithms. Includes solved problems.', size: '4.2 MB', section: 'Section B' },
  { title: 'Operating Systems Essentials', desc: 'In-depth concepts of process management, deadlocks, and memory allocation.', size: '3.8 MB', section: 'Section B' },
  { title: 'Quantitative Aptitude Guide', desc: 'Mental math shortcuts and practice questions for Section A logical reasoning.', size: '5.1 MB', section: 'Section A' },
  { title: 'C Programming Fundamentals', desc: 'Pointers, memory management, and pre-processor directives for Section B.', size: '2.5 MB', section: 'Section B' },
  { title: 'Computer Architecture', desc: 'CPU pipelining, cache memory, and instruction set architectures explained.', size: '6.4 MB', section: 'Section B' },
  { title: 'Logical Reasoning Pro', desc: 'Critical thinking, syllogisms, and sequence pattern matching for Section A.', size: '3.1 MB', section: 'Section A' },
  { title: 'Database Management Systems', desc: 'SQL queries, normalization, and transaction processing for Section B.', size: '4.0 MB', section: 'Section B' },
  { title: 'English Comprehension', desc: 'Reading passages, grammar rules, and vocabulary building for Section A.', size: '2.8 MB', section: 'Section A' },
]

export default function StudyMaterial() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.desc.toLowerCase().includes(search.toLowerCase())
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
          <div className="flex items-center gap-lg">
            {user && <span className="hidden md:block font-body-sm text-body-sm text-on-surface-variant">{user.email}</span>}
            {user ? (
              <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all">
                Logout
              </button>
            ) : (
              <button onClick={() => navigate('/login')}
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all">
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mt-[72px] flex-grow">
        <section className="max-w-container-max mx-auto px-gutter py-lg text-center md:text-left">
          <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-label-md text-label-md mb-md">
            CDAC C-CAT Resources
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-sm">Study Materials</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Download or view PDFs for Section A and Section B prep. All materials are updated for the 2024 academic cycle.
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

        {filtered.length > 0 ? (
          <section className="max-w-container-max mx-auto px-gutter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md pb-xl">
            {filtered.map((material) => (
              <div key={material.title} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col h-full"
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
                    <span>File Size: {material.size}</span>
                    <span>{material.section}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <button className="flex items-center justify-center gap-xs py-2 border border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary/5 transition-colors">
                      View
                    </button>
                    <button className="flex items-center justify-center gap-xs py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Download
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
            <p className="font-body-sm text-body-sm text-on-surface-variant">&copy; 2024 DataWiz. CDAC C-CAT Exam Prep Platform.</p>
          </div>
          <div className="flex flex-wrap gap-md md:justify-end">
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Terms of Service</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Contact Us</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">FAQ</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
