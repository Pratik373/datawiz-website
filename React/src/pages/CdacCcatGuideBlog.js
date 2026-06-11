import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './CdacCcatGuideBlog.css'

function ProfileDropdown({ user, navigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="px-6 py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all justify-self-end whitespace-nowrap"
      >
        Login
      </button>
    )
  }

  const initials = (user.user_metadata?.full_name || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture

  return (
    <div className="relative justify-self-end" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 group animate-fade-in"
        aria-label="Profile menu"
      >
        <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-primary/20 group-hover:ring-primary/50 overflow-hidden transition-all">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span
          className="material-symbols-outlined text-on-surface-variant text-[18px] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-outline-variant overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
            <p className="font-label-md text-label-md text-on-surface truncate text-left">{displayName}</p>
            <p className="text-xs text-on-surface-variant truncate mt-0.5 text-left">{user.email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                navigate('/tests')
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">quiz</span>
              My Tests
            </button>
            <button
              onClick={() => {
                supabase.auth.signOut().then(() => {
                  setOpen(false)
                  navigate('/')
                })
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CdacCcatGuideBlog() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      q: "Can I apply for both Category II and III courses?",
      a: "Yes, but you'll need to pay the Category III fee (₹1,750) and appear for all three sections. During counselling, you can then choose from both Category II and III courses based on your rank."
    },
    {
      q: "What happens if I'm in my final year of engineering?",
      a: "You can still apply and get a provisional admission if selected. However, you must submit your degree/mark sheet proving you've passed by 31 December 2026 to continue in the program."
    },
    {
      q: "Is there any age restriction for C-CAT?",
      a: "No. C-DAC has no age limit for the C-CAT exam. Anyone who meets the educational qualification criteria is eligible, regardless of their age."
    },
    {
      q: "How is the C-CAT rank calculated?",
      a: "Your rank is based on your total score across the relevant sections. For Category II, it's your score in Sections A + B. For Category III, it's the combined score across all three sections. Within the same score, tie-breaking criteria apply as specified by C-DAC."
    },
    {
      q: "Can I change my course preference during counselling?",
      a: "Yes, during the counselling window (16–23 July) you can update your preferences. However, once you confirm and freeze your seat by paying the first installment, you're committed to that choice."
    },
    {
      q: "Is PGCP-AI harder to get into than other courses?",
      a: "Two things make PGCP-AI more selective: it requires 60% minimum eligibility (vs. 55% for others), and it's one of the most popular choices, so competition for seats is typically fierce. Good Section B scores are especially important."
    },
    {
      q: "Are there online course options?",
      a: "Yes! Courses like PGCP-AC (Advanced Computing), PGCP-BDA, PGCP-AI, and PGCP-CSF offer online mode at select centres. PGCP-FBD (FinTech & Blockchain) is exclusively online. Physical attendance is required for courses like PGCP-MC, PGCP-ESD, and PGCP-VLSI."
    }
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant">
        <div className="flex justify-between items-center px-4 sm:px-gutter py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-md">
            <button
              onClick={() => navigate('/blogs')}
              className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Blogs
            </button>
          </div>
          <ProfileDropdown user={user} navigate={navigate} />
        </div>
      </header>

      {/* Main Content (Scoped CSS Blog Post) */}
      <main className="mt-[72px] flex-grow ccat-guide-container">
        
        {/* HERO */}
        <div className="hero">
          <div className="hero-badge">📅 August 2026 Batch</div>
          <h1>The Only CDAC CCAT Guide<br />You'll Ever Need — <span>August 2026</span></h1>
          <p>Everything from exam dates and syllabus to eligibility and counselling — explained simply, so you can focus on what matters: cracking the exam.</p>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="num">4 & 5</span>
              <span className="lbl">Exam Dates (July)</span>
            </div>
            <div className="hero-stat">
              <span className="num">50</span>
              <span className="lbl">Questions / Section</span>
            </div>
            <div className="hero-stat">
              <span className="num">150</span>
              <span className="lbl">Marks / Section</span>
            </div>
            <div className="hero-stat">
              <span className="num">35</span>
              <span className="lbl">Exam Cities</span>
            </div>
            <div className="hero-stat">
              <span className="num">12+</span>
              <span className="lbl">Courses Offered</span>
            </div>
          </div>
        </div>

        {/* ALERT */}
        <div className="container">
          <div className="alert-banner">
            <span className="icon">⚠️</span>
            <div><strong>Application Deadline:</strong> 23 June 2026 at 5:00 PM — Don't miss this. The window to apply is only about 4 weeks long. Check eligibility, keep documents ready, and apply early to avoid technical issues.</div>
          </div>
        </div>

        {/* CONTENT LAYOUT */}
        <div className="content-layout">

          {/* MAIN COLUMN */}
          <div className="main-column">

            {/* INTRO */}
            <div className="section">
              <div className="section-label">Introduction</div>
              <h2>What is CDAC C-CAT?</h2>
              <div className="divider"></div>
              <p>If you're a fresh engineering or science graduate looking to land your first tech job — or switch into a high-growth domain like AI, Cybersecurity, or Embedded Systems — <strong>CDAC's Post Graduate Certificate Programs (PGCP)</strong> are one of the most respected pathways in India.</p>
              <p>The <strong>C-CAT (C-DAC Common Admission Test)</strong> is the gateway to all these programs. It's a single entrance exam that determines your rank — and your rank determines which course and which CDAC centre you get into. Done right, one month of focused preparation can open doors to a 6-month industry-ready program that genuinely changes careers.</p>
              <p>This guide covers the August 2026 batch — the most sought-after batch of the year. Let's get into everything you need to know.</p>
              <div className="info-box tip">
                <span className="box-icon">💡</span>
                <p><strong>Quick tip:</strong> C-DAC courses run for 24 weeks (about 6 months). The August 2026 batch runs from <strong>24 August 2026 to 6 February 2027</strong>. Perfect timing to graduate and be job-ready by early 2027.</p>
              </div>
            </div>

            {/* IMPORTANT DATES */}
            <div className="section" id="dates">
              <div className="section-label">Timeline</div>
              <h2>Important Dates — August 2026 Batch</h2>
              <div className="divider"></div>
              <p>Bookmark this section. These dates define your entire journey from application to batch start. Miss any one of these and you'll be waiting for the next batch.</p>

              <div className="date-grid">
                <div className="date-card done">
                  <div className="event-icon">📋</div>
                  <div className="event-label">Applications Open</div>
                  <div className="event-name">Application Window Starts</div>
                  <div className="event-date">26 May 2026</div>
                </div>
                <div className="date-card urgent">
                  <div className="event-icon">🔔</div>
                  <div className="event-label">⚠️ Deadline</div>
                  <div className="event-name">Last Date to Apply & Pay Fee</div>
                  <div className="event-date">23 June 2026, 5:00 PM</div>
                </div>
                <div className="date-card">
                  <div className="event-icon">🪪</div>
                  <div className="event-label">Admit Card</div>
                  <div className="event-name">Download Admit Card</div>
                  <div className="event-date">30 June – 4 July 2026</div>
                </div>
                <div className="date-card urgent">
                  <div className="event-icon">✍️</div>
                  <div className="event-label">⭐ Exam Day</div>
                  <div className="event-name">C-CAT Exam</div>
                  <div className="event-date">4 & 5 July 2026</div>
                </div>
                <div className="date-card">
                  <div className="event-icon">🏆</div>
                  <div className="event-label">Results</div>
                  <div className="event-name">C-CAT Ranks Announced</div>
                  <div className="event-date">16 July 2026</div>
                </div>
                <div className="date-card">
                  <div className="event-icon">🎯</div>
                  <div className="event-label">1st Counselling</div>
                  <div className="event-name">Course & Centre Selection</div>
                  <div className="event-date">16–23 July 2026</div>
                </div>
                <div className="date-card">
                  <div className="event-icon">💺</div>
                  <div className="event-label">Round 1 Seats</div>
                  <div className="event-name">First Seat Allocation</div>
                  <div className="event-date">25 July 2026</div>
                </div>
                <div className="date-card">
                  <div className="event-icon">💺</div>
                  <div className="event-label">Round 2 Seats</div>
                  <div className="event-name">Second Seat Allocation</div>
                  <div className="event-date">2 August 2026</div>
                </div>
                <div className="date-card">
                  <div className="event-icon">💺</div>
                  <div className="event-label">Round 3 Seats</div>
                  <div className="event-name">Third Seat Allocation</div>
                  <div className="event-date">13 August 2026</div>
                </div>
                <div className="date-card urgent">
                  <div className="event-icon">🎓</div>
                  <div className="event-label">Batch Begins</div>
                  <div className="event-name">August 2026 Batch Start</div>
                  <div className="event-date">24 August 2026</div>
                </div>
                <div className="date-card">
                  <div className="event-icon">🏁</div>
                  <div className="event-label">Batch Ends</div>
                  <div className="event-name">Course Completion</div>
                  <div className="event-date">6 February 2027</div>
                </div>
              </div>
            </div>

            {/* EXAM PATTERN */}
            <div className="section" id="pattern">
              <div className="section-label">Exam Structure</div>
              <h2>C-CAT Exam Pattern — Know This Inside Out</h2>
              <div className="divider"></div>
              <p>C-CAT is divided into three sections — A, B, and C. Each section is a separate 1-hour paper. Most courses require only Sections A and B. Category III courses (Embedded & VLSI) require all three sections.</p>

              <div className="section-cards">
                <div className="section-card a">
                  <div className="sec-letter">A</div>
                  <div className="sec-name">General Aptitude</div>
                  <div className="sec-detail">
                    <strong>50 Questions</strong> · 1 Hour<br />
                    <strong>150 Marks</strong> (3 marks each)<br />
                    −1 for wrong answer<br />
                    Required for <strong>all</strong> courses
                  </div>
                </div>
                <div className="section-card b">
                  <div className="sec-letter">B</div>
                  <div className="sec-name">Computer Programming</div>
                  <div className="sec-detail">
                    <strong>50 Questions</strong> · 1 Hour<br />
                    <strong>150 Marks</strong> (3 marks each)<br />
                    −1 for wrong answer<br />
                    Required for <strong>all</strong> courses
                  </div>
                </div>
                <div className="section-card c">
                  <div className="sec-letter">C</div>
                  <div className="sec-name">Hardware & Systems</div>
                  <div className="sec-detail">
                    <strong>50 Questions</strong> · 1 Hour<br />
                    <strong>150 Marks</strong> (3 marks each)<br />
                    −1 for wrong answer<br />
                    Required for <strong>Category III</strong> only
                    <div><span className="badge">ESD & VLSI Only</span></div>
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Total Sections</td><td>3 (A, B, C)</td></tr>
                    <tr><td>Duration per Section</td><td>1 hour</td></tr>
                    <tr><td>Questions per Section</td><td>50 objective-type (MCQs)</td></tr>
                    <tr><td>Marks per Correct Answer</td><td>+3 marks</td></tr>
                    <tr><td>Negative Marking</td><td>−1 for wrong answer</td></tr>
                    <tr><td>Unattempted Questions</td><td>0 marks (no penalty)</td></tr>
                    <tr className="highlight-row"><td>Total Marks per Section</td><td>150 marks</td></tr>
                    <tr><td>Language</td><td>English only</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="info-box warn">
                <span className="box-icon">⚡</span>
                <p><strong>Negative Marking Alert:</strong> With −1 for wrong answers and +3 for correct ones, the math is simple: <strong>don't guess blindly</strong>. If you're unsure between 3 options, skip. If you've narrowed it down to 2, attempt it — the expected value is positive.</p>
              </div>
            </div>

            {/* SYLLABUS */}
            <div className="section" id="syllabus">
              <div className="section-label">What to Study</div>
              <h2>Complete Syllabus — Section by Section</h2>
              <div className="divider"></div>
              <p>The syllabus is broad but very structured. Here's the complete breakdown. New additions for 2026 are marked with a <span className="new-badge">NEW</span> badge — pay attention to these, as examiners typically test new topics in the first year.</p>

              <h3>Section A — General Aptitude</h3>
              <div className="syllabus-grid">
                <div className="syllabus-block">
                  <div className="syllabus-block-header a">📝 English</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">Grammar</span>
                    <span className="topic-tag">Vocabulary</span>
                    <span className="topic-tag">Reading Comprehension</span>
                    <span className="topic-tag">Synonyms & Antonyms</span>
                    <span className="topic-tag">Sentence Completion</span>
                    <span className="topic-tag">Fill in the Blanks</span>
                    <span className="topic-tag">Prepositions</span>
                    <span className="topic-tag">Active/Passive Voice</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header a">🔢 Quantitative Aptitude</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">Probability</span>
                    <span className="topic-tag">Permutations & Combinations</span>
                    <span className="topic-tag">Algebra</span>
                    <span className="topic-tag">Averages</span>
                    <span className="topic-tag">Time, Speed & Distance</span>
                    <span className="topic-tag">Time & Work</span>
                    <span className="topic-tag">Profit & Loss</span>
                    <span className="topic-tag">Ratio & Proportion</span>
                    <span className="topic-tag">Simple & Compound Interest</span>
                    <span className="topic-tag">Percentage</span>
                    <span className="topic-tag">Number Series</span>
                    <span className="topic-tag">Mixtures</span>
                    <span className="topic-tag">Simplification</span>
                    <span className="topic-tag">Number System</span>
                    <span className="topic-tag">Geometry & Mensuration</span>
                    <span className="topic-tag">Logarithms</span>
                    <span className="topic-tag">Progressions</span>
                    <span className="topic-tag">LCM/HCF</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header a">🧩 Logical Reasoning</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">Number/Letter Series</span>
                    <span className="topic-tag">Analogies</span>
                    <span className="topic-tag">Puzzles</span>
                    <span className="topic-tag">Syllogisms</span>
                    <span className="topic-tag">Binary Logic</span>
                    <span className="topic-tag">Clocks & Calendars</span>
                    <span className="topic-tag">Cubes & Dice</span>
                    <span className="topic-tag">Blood Relations</span>
                    <span className="topic-tag">Coding-Decoding</span>
                    <span className="topic-tag">Seating Arrangement</span>
                    <span className="topic-tag">Venn Diagrams</span>
                    <span className="topic-tag">Direction Sense</span>
                    <span className="topic-tag">Decision Making</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header a">💻 Computer Fundamentals <span className="new-badge">NEW</span></div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag new">History of Computing</span>
                    <span className="topic-tag new">Computer Components</span>
                    <span className="topic-tag new">Data Mining</span>
                    <span className="topic-tag new">Machine Learning Basics</span>
                    <span className="topic-tag new">Artificial Intelligence</span>
                    <span className="topic-tag new">Cloud Computing</span>
                    <span className="topic-tag new">Big Data</span>
                    <span className="topic-tag new">Blockchain</span>
                    <span className="topic-tag new">Internet of Things (IoT)</span>
                  </div>
                </div>
              </div>

              <h3>Section B — Computer Programming & Concepts</h3>
              <div className="syllabus-grid">
                <div className="syllabus-block">
                  <div className="syllabus-block-header b">🔧 C Programming</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">Data Types & Variables</span>
                    <span className="topic-tag">Operators</span>
                    <span className="topic-tag">Decision Making</span>
                    <span className="topic-tag">Loops</span>
                    <span className="topic-tag">Arrays</span>
                    <span className="topic-tag">Strings</span>
                    <span className="topic-tag">Functions</span>
                    <span className="topic-tag">Pointers</span>
                    <span className="topic-tag">Structures</span>
                    <span className="topic-tag">File Handling</span>
                    <span className="topic-tag">Dynamic Memory Allocation</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header b">🌳 Data Structures</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">Algorithm Analysis</span>
                    <span className="topic-tag">Linked Lists</span>
                    <span className="topic-tag">Stacks</span>
                    <span className="topic-tag">Queues</span>
                    <span className="topic-tag">Trees</span>
                    <span className="topic-tag">Hashing</span>
                    <span className="topic-tag">Sorting Algorithms</span>
                    <span className="topic-tag">Graph Algorithms</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header b">🧱 OOP Concepts (C++)</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">Classes & Objects</span>
                    <span className="topic-tag">Inheritance</span>
                    <span className="topic-tag">Virtual Functions</span>
                    <span className="topic-tag">Operator Overloading</span>
                    <span className="topic-tag">Templates</span>
                    <span className="topic-tag">Exception Handling</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header b">🖥️ OS & Networking</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">CPU Scheduling</span>
                    <span className="topic-tag">Process Synchronization</span>
                    <span className="topic-tag">Deadlocks</span>
                    <span className="topic-tag">Memory Management</span>
                    <span className="topic-tag">Application Layer</span>
                    <span className="topic-tag">TCP/IP Model</span>
                    <span className="topic-tag">Network Layer</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header b">🤖 Big Data & AI Basics <span className="new-badge">NEW</span></div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag new">Data Engineering Fundamentals</span>
                    <span className="topic-tag new">AI Concepts & Applications</span>
                  </div>
                </div>
              </div>

              <h3>Section C — Hardware (Category III Only)</h3>
              <div className="info-box note">
                <span className="box-icon">📌</span>
                <p><strong>Only for ESD and VLSI students.</strong> If you're applying for Embedded Systems Design (PGCP-ESD) or VLSI Design (PGCP-VLSI), you must also appear for Section C. This section tests hardware and electronics fundamentals.</p>
              </div>
              <div className="syllabus-grid">
                <div className="syllabus-block">
                  <div className="syllabus-block-header c">🖥️ Computer Architecture</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">Basic Structure of Computers</span>
                    <span className="topic-tag">Processor & Control Unit</span>
                    <span className="topic-tag">Parallelism</span>
                    <span className="topic-tag">Memory Systems</span>
                    <span className="topic-tag">I/O Systems</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header c">⚡ Digital Electronics</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">Combinational Circuits</span>
                    <span className="topic-tag">Sequential Circuits</span>
                    <span className="topic-tag">Memory Devices</span>
                  </div>
                </div>
                <div className="syllabus-block">
                  <div className="syllabus-block-header c">🔲 Microprocessors</div>
                  <div className="syllabus-block-body">
                    <span className="topic-tag">8-bit Microprocessors</span>
                    <span className="topic-tag">16-bit Microprocessors</span>
                    <span className="topic-tag">8085 Architecture</span>
                    <span className="topic-tag">Peripheral Interfacing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ELIGIBILITY */}
            <div className="section" id="eligibility">
              <div className="section-label">Who Can Apply</div>
              <h2>Eligibility Criteria</h2>
              <div className="divider"></div>
              <p>C-DAC is welcoming to engineers and science graduates from a range of disciplines. Here's exactly what you need to qualify:</p>

              <div className="eligibility-cards">
                <div className="elig-card">
                  <div className="icon">🎓</div>
                  <h4>Core Engineering Graduates</h4>
                  <p>BE/BTech in IT, Computer Science, Electronics, Telecommunications, Electrical, or Instrumentation (10+2+4 format)</p>
                </div>
                <div className="elig-card">
                  <div className="icon">🔬</div>
                  <h4>Science Postgraduates</h4>
                  <p>MSc/MS in Computer Science, IT, or Electronics (10+2+3+2 format). Three-year degrees with a postgrad qualify too.</p>
                </div>
                <div className="elig-card">
                  <div className="icon">📊</div>
                  <h4>Minimum Marks Required</h4>
                  <p><strong>55%</strong> aggregate for most courses.<br /><strong>60%</strong> for PGCP-AI (Artificial Intelligence) specifically.</p>
                </div>
                <div className="elig-card">
                  <div className="icon">🎂</div>
                  <h4>Age Limit</h4>
                  <p>There is <strong>no age restriction</strong> for the C-CAT. Anyone who meets the educational criteria can apply, regardless of age.</p>
                </div>
                <div className="elig-card">
                  <div className="icon">📅</div>
                  <h4>Final Year Students</h4>
                  <p>If you're appearing for your final exams in 2026, you can apply for <strong>provisional admission</strong>. You must submit proof of passing by 31 December 2026.</p>
                </div>
              </div>

              <div className="info-box warn">
                <span className="box-icon">🔖</span>
                <p><strong>Aspiring for PGCP-AI?</strong> Note the higher eligibility bar — <strong>60% minimum</strong> vs the usual 55% for other courses. Ensure your degree percentage meets this before choosing AI as your first preference.</p>
              </div>
            </div>

            {/* COURSE CATEGORIES */}
            <div className="section" id="categories">
              <div className="section-label">Courses & Categories</div>
              <h2>Category II vs Category III — What's the Difference?</h2>
              <div className="divider"></div>
              <p>C-DAC divides its courses into two categories based on which exam sections you need to appear for:</p>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Courses</th>
                      <th>Sections Required</th>
                      <th>C-CAT Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Category II</td>
                      <td>PGCP-AC, PGCP-BDA, PGCP-AI, PGCP-MC, PGCP-ITISS, PGCP-ASSD, PGCP-HPCSA, PGCP-FBD, PGCP-CSF, PGCP-RAT</td>
                      <td>Sections A + B</td>
                      <td>₹1,550 (incl. GST)</td>
                    </tr>
                    <tr className="highlight-row">
                      <td>Category III</td>
                      <td>PGCP-ESD (Embedded Systems), PGCP-VLSI (VLSI Design)</td>
                      <td>Sections A + B + C</td>
                      <td>₹1,750 (incl. GST)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="info-box tip">
                <span className="box-icon">💡</span>
                <p><strong>Pro Tip:</strong> The C-CAT fee is very affordable and <strong>non-refundable</strong>. If you're even slightly interested in hardware roles, pay the extra ₹200 and appear for Category III (A+B+C). This keeps your options open for ESD and VLSI courses too.</p>
              </div>
            </div>

            {/* EXAM CITIES */}
            <div className="section" id="cities">
              <div className="section-label">Exam Locations</div>
              <h2>35 Exam Cities Across India</h2>
              <div className="divider"></div>
              <p>C-CAT is conducted across <strong>35 cities in India</strong>. During the application, you'll be asked to select <strong>3 city preferences</strong> in order of priority. You'll be allotted one centre based on availability.</p>

              <div className="cities-grid">
                <span className="city-tag">📍 Ahmedabad</span>
                <span className="city-tag">📍 Aurangabad</span>
                <span className="city-tag">📍 Bengaluru</span>
                <span className="city-tag">📍 Bhilai</span>
                <span className="city-tag">📍 Bhopal</span>
                <span className="city-tag">📍 Bhubaneswar</span>
                <span className="city-tag">📍 Chennai</span>
                <span className="city-tag">📍 Guwahati</span>
                <span className="city-tag">📍 Hyderabad</span>
                <span className="city-tag">📍 Indore</span>
                <span className="city-tag">📍 Jaipur</span>
                <span className="city-tag">📍 Karad</span>
                <span className="city-tag">📍 Kochi</span>
                <span className="city-tag">📍 Kolhapur</span>
                <span className="city-tag">📍 Kolkata</span>
                <span className="city-tag">📍 Lucknow</span>
                <span className="city-tag">📍 Mohali</span>
                <span className="city-tag">📍 Mumbai</span>
                <span className="city-tag">📍 Nagpur</span>
                <span className="city-tag">📍 Nashik</span>
                <span className="city-tag">📍 Navi Mumbai</span>
                <span className="city-tag">📍 New Delhi</span>
                <span className="city-tag">📍 Noida</span>
                <span className="city-tag">📍 Patna</span>
                <span className="city-tag">📍 Prayagraj</span>
                <span className="city-tag highlight">📍 Pune ⭐</span>
                <span className="city-tag">📍 Ranchi</span>
                <span className="city-tag">📍 Silchar</span>
                <span className="city-tag">📍 Solapur</span>
                <span className="city-tag">📍 Thiruvananthapuram</span>
                <span className="city-tag">📍 Varanasi</span>
                <span className="city-tag">📍 Vijayawada</span>
              </div>

              <div className="info-box tip">
                <span className="box-icon">📌</span>
                <p>Remember to select <strong>3 city preferences</strong> during the application — not just one. List them in the order you'd prefer. City allocation is based on availability and is not guaranteed.</p>
              </div>
            </div>

            {/* COUNSELLING */}
            <div className="section" id="counselling">
              <div className="section-label">After the Exam</div>
              <h2>Counselling & Seat Allocation Process</h2>
              <div className="divider"></div>
              <p>This is where your rank becomes a seat. The process runs over 3 rounds across 2 counselling sessions. Here's how it works, step by step:</p>

              <div className="process-steps">
                <div className="process-step">
                  <div className="step-num">1</div>
                  <div className="step-content">
                    <h4>Ranks Announced (16 July)</h4>
                    <p>C-DAC publishes your rank based on your combined score across sections. Your rank is your currency in the counselling process.</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-num">2</div>
                  <div className="step-content">
                    <h4>1st Counselling — Course & Centre Selection (16–23 July)</h4>
                    <p>You log in and submit your preferences: which courses and which CDAC centres you want, in order of priority. Think carefully — higher-ranked candidates get first pick.</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-num">3</div>
                  <div className="step-content">
                    <h4>Round 1 Seat Allocation (25 July)</h4>
                    <p>Seats are allotted based on rank and preferences. To lock your Round 1 seat, pay the first installment of ₹15,000 + GST. This is non-refundable once you freeze.</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-num">4</div>
                  <div className="step-content">
                    <h4>Round 2 Seat Allocation (2 August)</h4>
                    <p>A second round of allocation for remaining seats and candidates who didn't confirm Round 1. If a better option appears, you may upgrade your preference.</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-num">5</div>
                  <div className="step-content">
                    <h4>Round 3 — 2nd Counselling for Vacant Seats (13 August)</h4>
                    <p>Remaining vacant seats go into a second counselling. This is your last chance if you didn't get your desired course or centre in earlier rounds.</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-num">6</div>
                  <div className="step-content">
                    <h4>Batch Begins (24 August 2026)</h4>
                    <p>Report to your allocated CDAC centre. The 24-week program begins — leading to course completion on 6 February 2027.</p>
                  </div>
                </div>
              </div>

              <div className="info-box note">
                <span className="box-icon">🔒</span>
                <p><strong>Freezing a seat:</strong> Once you pay the first installment (₹15,000 + GST) and freeze Round 1, you're committed to that course and centre. Choose wisely — don't freeze just because you're nervous about availability.</p>
              </div>
            </div>

            {/* FEE */}
            <div className="section" id="fees">
              <div className="section-label">Fee Structure</div>
              <h2>C-CAT Exam Fee</h2>
              <div className="divider"></div>
              <p>The exam fee is straightforward and very affordable compared to most competitive entrance tests:</p>
              <div className="fee-row">
                <div className="fee-highlight">
                  <div className="amount">₹1,550</div>
                  <div className="type">Category II (Sections A + B)</div>
                  <div className="type" style={{ marginTop: '4px', fontSize: '0.75rem' }}>AC, BDA, AI, MC, ITISS, ASSD, HPCSA, FBD, CSF, RAT</div>
                </div>
                <div className="fee-highlight">
                  <div className="amount">₹1,750</div>
                  <div className="type">Category III (Sections A + B + C)</div>
                  <div className="type" style={{ marginTop: '4px', fontSize: '0.75rem' }}>ESD (Embedded Systems), VLSI Design</div>
                </div>
              </div>
              <div className="info-box warn">
                <span className="box-icon">⚠️</span>
                <p><strong>Important:</strong> The C-CAT exam fee is <strong>non-refundable</strong> under any circumstances. Complete your payment before the 23 June 5 PM deadline. Don't risk missing it — technical failures happen at the last minute.</p>
              </div>
            </div>

            {/* PREP TIPS */}
            <div className="section" id="prep">
              <div className="section-label">How to Prepare</div>
              <h2>Preparation Tips That Actually Work</h2>
              <div className="divider"></div>
              <p>You have about 5–6 weeks from application to exam day. Here's how to use them well:</p>
              <div className="prep-grid">
                <div className="prep-card">
                  <div className="prep-icon">📚</div>
                  <h4>Master Section B First</h4>
                  <p>C Programming, Data Structures, and OOP — these form the bulk of Section B and are the most predictable. If you have an engineering background, this is your scoring zone.</p>
                </div>
                <div className="prep-card">
                  <div className="prep-icon">🧮</div>
                  <h4>Don't Ignore Quant</h4>
                  <p>Many technical candidates underestimate Section A. Speed and accuracy in quant can separate you from thousands of candidates with similar technical knowledge.</p>
                </div>
                <div className="prep-card">
                  <div className="prep-icon">🆕</div>
                  <h4>Study the New Topics</h4>
                  <p>The new additions (AI basics, IoT, Cloud, Blockchain in Section A, and Data Engineering in Section B) are fresh — most existing material won't cover them. Read up specifically.</p>
                </div>
                <div className="prep-card">
                  <div className="prep-icon">🎯</div>
                  <h4>Attempt Mock Tests Weekly</h4>
                  <p>Timed mock tests are non-negotiable. They train your instincts for which questions to attempt, skip, or guess — skills that can't be built from reading alone.</p>
                </div>
                <div className="prep-card">
                  <div className="prep-icon">⏱️</div>
                  <h4>Manage Your 60 Minutes</h4>
                  <p>50 questions in 60 minutes = 72 seconds per question. Practice finishing in 50 minutes so you have time to revisit tricky questions without panic.</p>
                </div>
                <div className="prep-card">
                  <div className="prep-icon">🧠</div>
                  <h4>Smart Negative Marking Strategy</h4>
                  <p>Skip questions you have zero idea about. Attempt when you can eliminate at least 2 options. The expected value favours attempting if you've narrowed it to 2 choices.</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="section" id="faq">
              <div className="section-label">Common Questions</div>
              <h2>Frequently Asked Questions</h2>
              <div className="divider"></div>

              <div className="faq">
                {faqs.map((faq, index) => (
                  <div key={index} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
                    <button className="faq-btn" onClick={() => toggleFaq(index)}>
                      {faq.q}
                    </button>
                    <div className="faq-answer">
                      {faq.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-card-header">📑 Quick Navigation</div>
              <div className="sidebar-card-body">
                <ul className="toc-list">
                  <li><a href="#dates">Important Dates</a></li>
                  <li><a href="#pattern">Exam Pattern</a></li>
                  <li><a href="#syllabus">Syllabus</a></li>
                  <li><a href="#eligibility">Eligibility</a></li>
                  <li><a href="#categories">Course Categories</a></li>
                  <li><a href="#cities">Exam Cities</a></li>
                  <li><a href="#counselling">Counselling Process</a></li>
                  <li><a href="#fees">Fee Structure</a></li>
                  <li><a href="#prep">Prep Tips</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
            </div>

            <div className="cta-box" id="mock-test">
              <h4>🎯 Practice with Free Mock Tests</h4>
              <p>Timed mock tests with C-CAT-style questions for all three sections. Track your performance and improve before exam day.</p>
              <button onClick={() => navigate('/tests')} className="cta-btn">Start Free Mock Test →</button>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-header">⚡ Key Deadlines</div>
              <div className="sidebar-card-body" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--tertiary)' }}>23 Jun 5PM</strong><br />Application deadline</p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--primary)' }}>4–5 Jul</strong><br />C-CAT Exam Days</p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--primary)' }}>16 Jul</strong><br />Ranks Announced</p>
                <p><strong style={{ color: 'var(--primary)' }}>24 Aug</strong><br />Batch Starts</p>
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-header">🔗 Official Links</div>
              <div className="sidebar-card-body">
                <ul className="toc-list">
                  <li><a href="https://cdac.in" target="_blank" rel="noopener noreferrer">cdac.in — Official Site</a></li>
                  <li><a href="https://cdac.in/index.aspx?id=pg_ccat" target="_blank" rel="noopener noreferrer">C-CAT Official Page</a></li>
                  <li><a href="https://acts.cdac.in" target="_blank" rel="noopener noreferrer">ACTS Pune</a></li>
                </ul>
              </div>
            </div>
          </aside>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant w-full py-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md px-gutter max-w-container-max mx-auto">
          <div className="flex flex-col gap-xs">
            <div className="font-headline-sm text-headline-sm font-bold text-primary text-left">DataWiz</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-left">&copy; 2026 DataWiz. CDAC C-CAT Exam Prep Platform.</p>
          </div>
          <div className="flex flex-wrap gap-md md:justify-end items-center">
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
