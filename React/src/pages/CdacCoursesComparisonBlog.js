import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ProfileDropdown from '../components/ProfileDropdown'
import './CdacCoursesComparisonBlog.css'

export default function CdacCoursesComparisonBlog() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [selectedInterest, setSelectedInterest] = useState(null)
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
      q: "Can I switch from one course to another after counselling?",
      a: "Not easily. Once you freeze a seat, switching is typically not possible. Make sure your preference list is thoughtful — place your actual first choice at the top, not a 'safe' backup."
    },
    {
      q: "Is there a difference between C-DAC main centres and ATCs?",
      a: "Yes. C-DAC main centres (like C-DAC Pune/ACTS, C-DAC Hyderabad) are run directly by C-DAC and tend to have better lab infrastructure, more course offerings, and a larger alumni network. ATCs are authorised partners — many are excellent (like Sunbeam Hinjawadi), but the experience can vary. Research individual ATC reputations before your counselling."
    },
    {
      q: "Which course has the best placement outcomes?",
      a: "PGCP-AC has the highest raw number of placements due to sheer seat volume. PGCP-AI and PGCP-VLSI typically see the highest salary packages. PGCP-CSF and PGCP-BDA have strong consistent demand. Ultimately, placement outcomes depend heavily on the centre, your own preparation, and market timing."
    },
    {
      q: "Can I apply for both Category II and III courses?",
      a: "Yes — pay the Category III fee (₹1,750), appear for all three sections, and list both Category II and III courses in your counselling preferences. Your rank for each category is computed separately."
    },
    {
      q: "Is PGCP-FBD (FinTech & Blockchain) a good course for employment?",
      a: "It's niche but growing. Blockchain developer roles are in demand, especially in FinTech startups, crypto platforms, and enterprise blockchain projects. The downside: it's the only truly online course and only offered at one centre (C-DAC Patna). If you're genuinely interested in blockchain, it's a very targeted course. If you're unsure, PGCP-AC is safer."
    },
    {
      q: "I'm from Pune — should I always prefer Pune centres?",
      a: "Not necessarily. Staying local saves on accommodation costs, which is a real financial benefit. However, if a better-suited centre for your course (like C-DAC Hyderabad for ESD/VLSI, or C-DAC Bengaluru for BDA) is within your rank range, it might be worth the move. The extra exposure to a tech hub city can meaningfully impact your job search."
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
      <main className="mt-[72px] flex-grow courses-comp-container">
        
        {/* HERO */}
        <div className="hero">
          <div className="hero-badge">🎓 August 2026 Batch</div>
          <h1>CDAC Courses Compared:<br /><span className="accent">Which One is Right for You?</span></h1>
          <p>12 courses. Dozens of institutes. One correct answer for your career. Here's everything you need to pick the right path — without the confusion.</p>
          <div className="hero-chips">
            <span className="hero-chip">12 Courses</span>
            <span className="hero-chip">Category II & III</span>
            <span className="hero-chip">Pune · Hyderabad · Bengaluru · Mumbai</span>
            <span className="hero-chip">Online & Physical Modes</span>
            <span className="hero-chip">Seat Capacity Breakdown</span>
          </div>
        </div>

        {/* CONTENT LAYOUT */}
        <div className="content-layout">

          {/* MAIN */}
          <div className="main-column">

            {/* INTRO */}
            <div className="section">
              <div className="section-label">Why This Guide Exists</div>
              <h2>The Problem with Choosing a CDAC Course</h2>
              <div className="divider"></div>
              <p>Every year, thousands of engineering graduates clear the C-CAT but then freeze up during counselling. 12 courses, 40+ centres, limited seats, and a short window to decide — it's genuinely confusing.</p>
              <p>The wrong choice can mean spending 6 months in a course that doesn't align with what you want to do. The right choice? It can shortcut your career by years.</p>
              <p>This guide is designed to cut through the noise. We'll map each course to real career outcomes, compare institutes honestly, and help you figure out — before exam day — what you should be aiming for during counselling.</p>

              <div className="info-box tip">
                <span className="box-icon">🎯</span>
                <p><strong>Best way to use this guide:</strong> Start with the Career Goal section to identify which course fits your ambitions. Then use the Institute Comparison tables to know which centres to prioritise during counselling.</p>
              </div>
            </div>

            {/* ALL COURSES */}
            <div className="section" id="courses">
              <div className="section-label">All Courses</div>
              <h2>The Complete CDAC Course Lineup — August 2026</h2>
              <div className="divider"></div>
              <p>All courses run for <strong>24 weeks (1,200 hours)</strong> and lead to a Post Graduate Certificate. Here's the full picture:</p>

              <div className="courses-grid">
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-AC · Category II</div>
                    <div className="course-card-name">Advanced Computing</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-both">🌐 Online / Physical</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">The most popular CDAC course. Covers full-stack development, OS, databases, and modern software engineering. Ideal for software developer roles.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-AI · Category II</div>
                    <div className="course-card-name">Artificial Intelligence</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-both">🌐 Online / Physical</span>
                      <span className="meta-tag marks" style={{ background: '#fce4e4', color: '#c0392b' }}>60% min ⭐</span>
                    </div>
                    <div className="course-card-desc">The hottest course of the moment. Focused on ML, deep learning, and AI applications. Higher eligibility bar reflects higher demand.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-BDA · Category II</div>
                    <div className="course-card-name">Big Data Analytics</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-both">🌐 Online / Physical</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">Focuses on data pipelines, Hadoop, Spark, and analytics tools. Strong path into data engineering and data science roles.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-CSF · Category II</div>
                    <div className="course-card-name">Cyber Security & Forensics</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-both">🌐 Online / Physical</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">Covers ethical hacking, digital forensics, network security, and compliance. Growing demand with the surge in cyberattacks across industries.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-MC · Category II</div>
                    <div className="course-card-name">Mobile Computing</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-physical">🏛️ Physical Only</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">Android and iOS development, mobile UX, and backend integration. Leads directly into mobile app development careers.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-FBD · Category II</div>
                    <div className="course-card-name">FinTech & Blockchain Dev</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-online">💻 Online Only</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">The only fully online CDAC course. Covers blockchain, smart contracts, DeFi, and financial tech. Perfect for those interested in Web3 and fintech.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-ITISS · Category II</div>
                    <div className="course-card-name">IT Infrastructure, Systems & Security</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-physical">🏛️ Physical Only</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">For those heading into network infrastructure, cloud administration, and IT security management roles.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-ASSD · Category II</div>
                    <div className="course-card-name">Advanced Secure Software Dev</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-physical">🏛️ Physical Only</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">Focuses on building secure applications from the ground up — static analysis, threat modelling, and secure SDLC practices.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-HPCSA · Category II</div>
                    <div className="course-card-name">HPC System Administration</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-physical">🏛️ Physical Only</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">High-Performance Computing systems management. A niche but in-demand track for scientific and government computing roles.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat2">
                    <div className="course-card-code">PGCP-RAT · Category II</div>
                    <div className="course-card-name">Robotics & Allied Technologies</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-physical">🏛️ Physical Only</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">⚠️ Exclusive to Mechanical/Mechatronics graduates. Covers industrial robotics, automation, and control systems.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat3">
                    <div className="course-card-code">PGCP-ESD · Category III</div>
                    <div className="course-card-name">Embedded Systems Design</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-physical">🏛️ Physical Only</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">Hands-on hardware + software integration. Microcontrollers, RTOS, IoT devices, and firmware development. Strong hiring from automotive and industrial sectors.</div>
                  </div>
                </div>
                <div className="course-card">
                  <div className="course-card-header cat3">
                    <div className="course-card-code">PGCP-VLSI · Category III</div>
                    <div className="course-card-name">VLSI Design</div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-meta">
                      <span className="meta-tag mode-physical">🏛️ Physical Only</span>
                      <span className="meta-tag marks">55% min</span>
                    </div>
                    <div className="course-card-desc">Chip and circuit design using Verilog/VHDL. High demand with India's semiconductor push. One of the best-paying tracks post-CDAC.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CAREER GUIDE */}
            <div className="section" id="career">
              <div className="section-label">Pick Your Path</div>
              <h2>Best Course by Career Goal</h2>
              <div className="divider"></div>
              <p>The most important question isn't \"which course is best?\" — it's \"which course is best <em>for what I want to do?</em>\" Here's the mapping:</p>

              <div className="career-grid">
                <div className="career-card">
                  <div className="career-icon">💻</div>
                  <h4>Software Developer</h4>
                  <div className="course-rec">PGCP-AC</div>
                  <div className="centre-rec">Best at: C-DAC Pune, C-DAC Mumbai (Kharghar)</div>
                </div>
                <div className="career-card">
                  <div className="career-icon">🤖</div>
                  <h4>AI / ML Engineer</h4>
                  <div className="course-rec">PGCP-AI</div>
                  <div className="centre-rec">Best at: C-DAC Pune, C-DAC Hyderabad<br /><small style={{ color: 'var(--tertiary)' }}>⚠️ 60% min marks required</small></div>
                </div>
                <div className="career-card">
                  <div className="career-icon">📊</div>
                  <h4>Data Scientist / Engineer</h4>
                  <div className="course-rec">PGCP-BDA</div>
                  <div className="centre-rec">Best at: C-DAC Bengaluru, C-DAC Pune</div>
                </div>
                <div className="career-card">
                  <div className="career-icon">📱</div>
                  <h4>Mobile App Developer</h4>
                  <div className="course-rec">PGCP-MC</div>
                  <div className="centre-rec">Best at: C-DAC Hyderabad (80 seats)</div>
                </div>
                <div className="career-card">
                  <div className="career-icon">🛡️</div>
                  <h4>Cybersecurity Professional</h4>
                  <div className="course-rec">PGCP-CSF</div>
                  <div className="centre-rec">Best at: C-DAC Trivandrum, C-DAC Pune</div>
                </div>
                <div className="career-card">
                  <div className="career-icon">⛓️</div>
                  <h4>Blockchain / FinTech Dev</h4>
                  <div className="course-rec">PGCP-FBD</div>
                  <div className="centre-rec">C-DAC Patna (Online Only)</div>
                </div>
                <div className="career-card">
                  <div className="career-icon">🔌</div>
                  <h4>Embedded Systems Engineer</h4>
                  <div className="course-rec">PGCP-ESD</div>
                  <div className="centre-rec">Best at: C-DAC Hyderabad, Sunbeam Hinjawadi</div>
                </div>
                <div className="career-card">
                  <div className="career-icon">🔧</div>
                  <h4>VLSI / Chip Designer</h4>
                  <div className="course-rec">PGCP-VLSI</div>
                  <div className="centre-rec">Best at: C-DAC Hyderabad, C-DAC Noida</div>
                </div>
                <div className="career-card">
                  <div className="career-icon">🔌</div>
                  <h4>IT Infrastructure Manager</h4>
                  <div className="course-rec">PGCP-ITISS</div>
                  <div className="centre-rec">Best at: C-DAC Pune, C-DAC Bengaluru</div>
                </div>
                <div className="career-card">
                  <div className="career-icon">🦾</div>
                  <h4>Robotics Engineer</h4>
                  <div className="course-rec">PGCP-RAT</div>
                  <div className="centre-rec">C-DAC Pune · Mech/Mechatronics only</div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE SELECTOR */}
            <div className="section" id="selector">
              <div className="section-label">Quick Tool</div>
              <h2>Not Sure? Find Your Course in 30 Seconds</h2>
              <div className="divider"></div>
              <div className="selector">
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--neutral-dark)', marginBottom: '8px' }}>What kind of work excites you most?</h3>
                <div className="selector-q">Click the closest match to your interest:</div>
                <div className="selector-options">
                  <button className={`sel-btn ${selectedInterest === 'software' ? 'active' : ''}`} onClick={() => setSelectedInterest('software')}>Building apps & software</button>
                  <button className={`sel-btn ${selectedInterest === 'ai' ? 'active' : ''}`} onClick={() => setSelectedInterest('ai')}>AI, machine learning, data</button>
                  <button className={`sel-btn ${selectedInterest === 'security' ? 'active' : ''}`} onClick={() => setSelectedInterest('security')}>Hacking, security, forensics</button>
                  <button className={`sel-btn ${selectedInterest === 'hardware' ? 'active' : ''}`} onClick={() => setSelectedInterest('hardware')}>Hardware, chips, embedded</button>
                  <button className={`sel-btn ${selectedInterest === 'mobile' ? 'active' : ''}`} onClick={() => setSelectedInterest('mobile')}>Mobile apps (Android/iOS)</button>
                  <button className={`sel-btn ${selectedInterest === 'blockchain' ? 'active' : ''}`} onClick={() => setSelectedInterest('blockchain')}>Blockchain, crypto, fintech</button>
                  <button className={`sel-btn ${selectedInterest === 'infra' ? 'active' : ''}`} onClick={() => setSelectedInterest('infra')}>Networks, servers, cloud infra</button>
                </div>

                {selectedInterest === 'software' && (
                  <div className="selector-result">
                    <h4>→ PGCP-AC (Advanced Computing) is your best bet</h4>
                    <p>The most versatile CDAC course. Covers full-stack development, databases, OS, and modern software engineering. The highest seat count means you have a better chance of getting your preferred centre. Top picks: <strong>C-DAC Pune</strong> or <strong>C-DAC Mumbai (Kharghar)</strong>.</p>
                  </div>
                )}
                {selectedInterest === 'ai' && (
                  <div className="selector-result">
                    <h4>→ PGCP-AI or PGCP-BDA — choose based on focus</h4>
                    <p>If you want to <strong>build AI/ML models</strong>: go for <strong>PGCP-AI</strong> (remember: 60% eligibility). If you're more interested in <strong>data pipelines, analytics, Spark/Hadoop</strong>: choose <strong>PGCP-BDA</strong>. Both are excellent. Top pick for AI: C-DAC Pune. For BDA: C-DAC Bengaluru.</p>
                  </div>
                )}
                {selectedInterest === 'security' && (
                  <div className="selector-result">
                    <h4>→ PGCP-CSF (Cyber Security & Forensics)</h4>
                    <p>One of the fastest-growing domains. Covers ethical hacking, digital forensics, network security, and compliance frameworks. Available online too. Best centres: <strong>C-DAC Thiruvananthapuram</strong> (60 seats) or <strong>C-DAC Pune</strong>.</p>
                  </div>
                )}
                {selectedInterest === 'hardware' && (
                  <div className="selector-result">
                    <h4>→ PGCP-ESD or PGCP-VLSI — depends on your background</h4>
                    <p>Both are <strong>Category III</strong> — you'll need to appear for Section C (hardware). <strong>ESD</strong> is broader: microcontrollers, RTOS, IoT devices. <strong>VLSI</strong> is chip-specific — Verilog, VHDL, circuit design. VLSI has fewer seats and is more niche, but placements are exceptional. Best: <strong>C-DAC Hyderabad</strong> for both.</p>
                  </div>
                )}
                {selectedInterest === 'mobile' && (
                  <div className="selector-result">
                    <h4>→ PGCP-MC (Mobile Computing)</h4>
                    <p>Focused entirely on Android/iOS development and mobile app architecture. Physical mode only. The largest seat capacity is at <strong>C-DAC Hyderabad (80 seats)</strong>. Only available at select centres, so rank matters here.</p>
                  </div>
                )}
                {selectedInterest === 'blockchain' && (
                  <div className="selector-result">
                    <h4>→ PGCP-FBD (FinTech & Blockchain Development)</h4>
                    <p>The only <strong>fully online</strong> CDAC course — ideal if you prefer remote learning. Covers blockchain protocols, smart contracts, DeFi, and financial technology. Offered exclusively at <strong>C-DAC Patna</strong>. Great for those interested in Web3 careers.</p>
                  </div>
                )}
                {selectedInterest === 'infra' && (
                  <div className="selector-result">
                    <h4>→ PGCP-ITISS (IT Infrastructure, Systems & Security)</h4>
                    <p>Covers enterprise networking, cloud administration, virtualization, and IT security management. Physical only. Best options: <strong>C-DAC Pune</strong> (60 seats), <strong>C-DAC Bengaluru</strong> (60 seats), or <strong>IACSD Akurdi, Pune</strong> (60 seats).</p>
                  </div>
                )}
              </div>
            </div>

            {/* INSTITUTES BY COURSE */}
            <div className="section" id="institutes">
              <div className="section-label">Where to Study</div>
              <h2>Top Institutes by Course</h2>
              <div className="divider"></div>
              <p>Your CDAC centre matters — it affects lab quality, placement connections, and your daily experience. Here's a detailed breakdown by course:</p>

              <h3>Advanced Computing (PGCP-AC) — Most Seats</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Centre</th><th>City</th><th>Mode</th><th>AC Seats</th><th>Why Go Here</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>C-DAC Mumbai (Kharghar)</td><td>Mumbai</td><td>Online/Physical</td><td>260</td><td>Largest AC capacity in India</td></tr>
                    <tr><td>C-DAC Pune</td><td>Pune</td><td>Online/Physical</td><td>240</td><td>Mother centre, best infrastructure <span className="best-badge">⭐ Top Pick</span></td></tr>
                    <tr><td>Sunbeam Hinjawadi</td><td>Pune</td><td>Physical</td><td>240</td><td>Strong placement record among ATCs</td></tr>
                    <tr><td>C-DAC Bengaluru</td><td>Bengaluru</td><td>Physical</td><td>240</td><td>Tech hub access for internships</td></tr>
                    <tr><td>IACSD Akurdi</td><td>Pune</td><td>Physical</td><td>240</td><td>Good ATC in Pune with AC + BDA combo</td></tr>
                  </tbody>
                </table>
              </div>

              <h3>Artificial Intelligence (PGCP-AI) — 60% Min Required</h3>
              <div className="info-box note">
                <span className="box-icon">⭐</span>
                <p><strong>Higher bar, higher reward.</strong> PGCP-AI requires 60% minimum — not the usual 55%. Fewer seats, intense competition, but excellent career outcomes. Secure a high C-CAT rank if this is your goal.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Centre</th><th>City</th><th>Mode</th><th>Seats</th><th>Why Go Here</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>C-DAC Pune</td><td>Pune</td><td>Online/Physical</td><td>60</td><td>Main AI centre, best faculty <span className="best-badge">⭐ Top Pick</span></td></tr>
                    <tr><td>C-DAC Mumbai (Kharghar)</td><td>Mumbai</td><td>Physical</td><td>60</td><td>Large capacity, Mumbai tech access</td></tr>
                    <tr><td>C-DAC Patna</td><td>Patna</td><td>Online/Physical</td><td>60</td><td>Online option, East India</td></tr>
                    <tr><td>C-DAC Hyderabad</td><td>Hyderabad</td><td>Physical</td><td>40</td><td>Strong tech hub, good industry links</td></tr>
                    <tr><td>C-DAC New Delhi</td><td>Delhi</td><td>Online/Physical</td><td>40</td><td>Best option for North India candidates</td></tr>
                  </tbody>
                </table>
              </div>

              <h3>Big Data Analytics (PGCP-BDA)</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Centre</th><th>City</th><th>Mode</th><th>Seats</th><th>Why Go Here</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>C-DAC Bengaluru</td><td>Bengaluru</td><td>Physical</td><td>120</td><td>Largest BDA seats, strong data industry access <span className="best-badge">⭐ Top Pick</span></td></tr>
                    <tr><td>C-DAC Mumbai (Kharghar)</td><td>Mumbai</td><td>Physical</td><td>90</td><td>Second largest, good options</td></tr>
                    <tr><td>C-DAC Pune</td><td>Pune</td><td>Online/Physical</td><td>60</td><td>Main centre, online option available</td></tr>
                    <tr><td>Sunbeam Hinjawadi</td><td>Pune</td><td>Physical</td><td>60</td><td>Good Pune ATC option</td></tr>
                  </tbody>
                </table>
              </div>

              <h3>Cyber Security & Forensics (PGCP-CSF)</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Centre</th><th>City</th><th>Mode</th><th>Seats</th><th>Why Go Here</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>C-DAC Thiruvananthapuram</td><td>Trivandrum</td><td>Online/Physical</td><td>60</td><td>Most CSF seats, security-focused environment <span className="best-badge">⭐ Top Pick</span></td></tr>
                    <tr><td>C-DAC Patna</td><td>Patna</td><td>Online</td><td>60</td><td>Online option, flexible mode</td></tr>
                    <tr><td>C-DAC Pune</td><td>Pune</td><td>Online/Physical</td><td>40</td><td>Main centre, Pune advantage</td></tr>
                    <tr><td>C-DAC Hyderabad</td><td>Hyderabad</td><td>Physical</td><td>40</td><td>Good security industry connections</td></tr>
                  </tbody>
                </table>
              </div>

              <h3>Embedded Systems (PGCP-ESD) & VLSI — Category III</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Centre</th><th>City</th><th>ESD Seats</th><th>VLSI Seats</th><th>Why Go Here</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>C-DAC Hyderabad</td><td>Hyderabad</td><td>120</td><td>40</td><td>Best for both — largest ESD + VLSI combo <span className="best-badge">⭐ Top Pick</span></td></tr>
                    <tr><td>Sunbeam Hinjawadi</td><td>Pune</td><td>120</td><td>—</td><td>Largest ESD among ATCs, strong labs</td></tr>
                    <tr><td>C-DAC Pune</td><td>Pune</td><td>60</td><td>40</td><td>Main centre, both ESD and VLSI available</td></tr>
                    <tr><td>C-DAC Bengaluru</td><td>Bengaluru</td><td>60</td><td>—</td><td>Tech hub access for embedded careers</td></tr>
                    <tr><td>C-DAC Noida</td><td>Noida</td><td>—</td><td>40</td><td>Good VLSI option for North India</td></tr>
                  </tbody>
                </table>
              </div>

              <h3>Mobile Computing (PGCP-MC) & Other Courses</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Course</th><th>Best Centre</th><th>City</th><th>Seats</th><th>Note</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>PGCP-MC (Mobile)</td><td>C-DAC Hyderabad</td><td>Hyderabad</td><td>80</td><td>Largest MC capacity</td></tr>
                    <tr><td>PGCP-FBD (FinTech/Blockchain)</td><td>C-DAC Patna</td><td>Patna</td><td>60</td><td>Online only course</td></tr>
                    <tr><td>PGCP-ITISS</td><td>C-DAC Pune / Bengaluru</td><td>Pune / BLR</td><td>60 each</td><td>Physical only</td></tr>
                    <tr><td>PGCP-RAT (Robotics)</td><td>C-DAC Pune</td><td>Pune</td><td>30</td><td>Mech/Mechatronics only</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PUNE SECTION */}
            <div className="section" id="pune">
              <div className="section-label">📍 Pune Guide</div>
              <h2>Pune Has More CDAC Options Than Any Other City</h2>
              <div className="divider"></div>
              <p>If you're in Pune — or targeting Pune as your centre — you're in luck. Pune has the <strong>C-DAC ACTS main centre</strong> plus 5 Authorised Training Centres (ATCs), giving you more choice than anywhere else in the country.</p>

              <div className="pune-grid">
                <div className="pune-card main">
                  <div className="centre-type">⭐ Main Centre</div>
                  <h4>C-DAC Pune (ACTS)</h4>
                  <div className="courses-list">AC · BDA · AI · ESD · VLSI · ITISS · CSF · RAT</div>
                  <div className="highlight-note">Mother centre — best infrastructure, most course options, largest overall seat capacity</div>
                </div>
                <div className="pune-card">
                  <div className="centre-type">Authorised Training Centre</div>
                  <h4>Sunbeam Hinjawadi</h4>
                  <div className="courses-list">AC · BDA · ESD · ITISS · MC</div>
                  <div className="highlight-note">Largest AC seats (240) and ESD seats (120) among Pune ATCs. Strong placement record.</div>
                </div>
                <div className="pune-card">
                  <div className="centre-type">Authorised Training Centre</div>
                  <h4>IACSD Akurdi</h4>
                  <div className="courses-list">AC · BDA · ITISS</div>
                  <div className="highlight-note">240 AC seats + BDA + ITISS combo. Good choice for AC or BDA in Pune.</div>
                </div>
                <div className="pune-card">
                  <div className="centre-type">Authorised Training Centre</div>
                  <h4>IET Shivajinagar</h4>
                  <div className="courses-list">AC only</div>
                  <div className="highlight-note">120 AC seats. Good option if you prefer a central Pune location.</div>
                </div>
                <div className="pune-card">
                  <div className="centre-type">Authorised Training Centre</div>
                  <h4>Infoway Kothrud</h4>
                  <div className="courses-list">AC only</div>
                  <div className="highlight-note">120 AC seats. Alternative Pune ATC for Advanced Computing.</div>
                </div>
                <div className="pune-card">
                  <div className="centre-type">Authorised Training Centre</div>
                  <h4>Know-IT Deccan</h4>
                  <div className="courses-list">AC · BDA</div>
                  <div className="highlight-note">AC + BDA combination in the heart of Pune. Smaller batch size.</div>
                </div>
              </div>

              <div className="info-box tip">
                <span className="box-icon">💡</span>
                <p><strong>Pune counselling tip:</strong> During seat selection, list your Pune preferences carefully. ACTS (main centre) is highly competitive. If your rank is mid-range, shortlist Sunbeam Hinjawadi or IACSD Akurdi as backup — both have excellent outcomes and larger seat counts.</p>
              </div>
            </div>

            {/* ONLINE vs PHYSICAL */}
            <div className="section" id="mode">
              <div className="section-label">Study Mode</div>
              <h2>Online vs Physical — What to Choose?</h2>
              <div className="divider"></div>
              <p>Several CDAC courses now offer online modes, giving you flexibility to study from home. But it's not always the right call. Here's an honest breakdown:</p>

              <div className="mode-comparison">
                <div className="mode-card online">
                  <h4>🌐 Online Mode</h4>
                  <ul className="mode-list">
                    <li>Study from your home city — save on rent</li>
                    <li>Available for: AC, BDA, AI, CSF (select centres)</li>
                    <li>PGCP-FBD is entirely online</li>
                    <li>Good for self-disciplined learners</li>
                    <li>Works well if you have a good study setup at home</li>
                  </ul>
                </div>
                <div className="mode-card physical">
                  <h4>🏛️ Physical Mode</h4>
                  <ul className="mode-list">
                    <li>Mandatory for: ESD, VLSI, MC, ITISS, ASSD, RAT</li>
                    <li>Better for lab-heavy courses (hardware, embedded)</li>
                    <li>Peer network and placement drives on campus</li>
                    <li>ACTS-style immersive learning environment</li>
                    <li>Recommended for first-time job seekers</li>
                  </ul>
                </div>
              </div>

              <div className="info-box warn">
                <span className="box-icon">🔍</span>
                <p><strong>Our honest take:</strong> For software courses (AC, BDA, AI), online works well if you're self-motivated. For anything with hardware components (ESD, VLSI) or hands-on labs — <strong>physical mode is significantly better</strong>. The lab access alone makes a big difference.</p>
              </div>
            </div>

            {/* SEAT CAPACITY */}
            <div className="section" id="seats">
              <div className="section-label">Seat Availability</div>
              <h2>Seat Capacity Overview — Know What You're Competing For</h2>
              <div className="divider"></div>
              <p>Understanding seat numbers helps you set realistic counselling targets. High-seat courses give you more room to negotiate. Low-seat courses require a strong rank.</p>

              <div className="seat-chart">
                <div className="seat-row">
                  <span className="seat-label">PGCP-AC (Advanced Computing)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar primary" style={{ width: '95%' }}>Very High (1000+ total)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-ESD (Embedded Systems)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar secondary" style={{ width: '72%' }}>High (400+ total)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-BDA (Big Data)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar primary" style={{ width: '68%' }}>High (400+ total)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-AI (Artificial Intelligence)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar secondary" style={{ width: '45%' }}>Medium (260+ total)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-CSF (Cyber Security)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar primary" style={{ width: '38%' }}>Medium (200+ total)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-ITISS</span>
                  <div className="seat-bar-wrap"><div className="seat-bar secondary" style={{ width: '33%' }}>Medium (~220 total)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-MC (Mobile Computing)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar tertiary" style={{ width: '22%' }}>Moderate (~120 total)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-VLSI (VLSI Design)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar tertiary" style={{ width: '18%' }}>Limited (~120 total)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-FBD (FinTech/Blockchain)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar tertiary" style={{ width: '12%' }}>Limited (60 seats)</div></div>
                </div>
                <div className="seat-row">
                  <span className="seat-label">PGCP-RAT (Robotics)</span>
                  <div className="seat-bar-wrap"><div className="seat-bar tertiary" style={{ width: '8%' }}>Very Limited (30 seats)</div></div>
                </div>
              </div>

              <div className="info-box tip">
                <span className="box-icon">📌</span>
                <p><strong>Strategy:</strong> If you're aiming for AI or VLSI, prioritise rank. These have limited seats and high demand. For AC or ESD, a mid-range rank still gives you good options at multiple quality centres.</p>
              </div>
            </div>

            {/* HOW TO CHOOSE CENTRE */}
            <div className="section" id="choose">
              <div className="section-label">Decision Framework</div>
              <h2>How to Choose the Right Centre During Counselling</h2>
              <div className="divider"></div>
              <p>Once you have your rank, you need to make smart choices in the 7-day counselling window. Here's a simple framework:</p>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Factor</th><th>What to Look For</th><th>Why It Matters</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Course fit</td><td>Pick course first, centre second</td><td>The course defines your career direction</td></tr>
                    <tr><td>Placement record</td><td>Tech hubs (BLR, HYD, PUN, MUM)</td><td>On-campus drives + industry connections</td></tr>
                    <tr><td>Seat availability</td><td>Check your rank vs seat count</td><td>Don't over-reach; have backup preferences ready</td></tr>
                    <tr><td>Mode preference</td><td>Online vs Physical based on your learning style</td><td>Affects daily experience and lab access</td></tr>
                    <tr><td>City familiarity</td><td>Prefer cities where you have network</td><td>Housing, commute, and local support matter</td></tr>
                    <tr><td>Centre type</td><td>Main CDAC centre vs ATC</td><td>Main centres typically have better labs and broader courses</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="info-box warn">
                <span className="box-icon">⚡</span>
                <p><strong>The most common counselling mistake:</strong> Choosing a course you're not sure about just because it has more available seats. Always list your genuine first choice first — even if seats are tight. Round 2 and Round 3 exist for a reason.</p>
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
                  <li><a href="#courses">All 12 Courses</a></li>
                  <li><a href="#career">Best Course by Goal</a></li>
                  <li><a href="#selector">Find Your Course</a></li>
                  <li><a href="#institutes">Top Institutes</a></li>
                  <li><a href="#pune">Pune Centres</a></li>
                  <li><a href="#mode">Online vs Physical</a></li>
                  <li><a href="#seats">Seat Capacity</a></li>
                  <li><a href="#choose">How to Choose</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
            </div>

            <div className="cta-box">
              <h4>📝 Prep for C-CAT</h4>
              <p>Take free mock tests aligned with the August 2026 syllabus. All three sections covered.</p>
              <button onClick={() => navigate('/tests')} className="cta-btn">Start Free Mock Test →</button>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-header">📊 Quick Comparisons</div>
              <div className="sidebar-card-body" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: '10px' }}><strong style={{ color: 'var(--neutral-dark)' }}>Most Seats:</strong><br />PGCP-AC (Advanced Computing)</p>
                <p style={{ marginBottom: '10px' }}><strong style={{ color: 'var(--neutral-dark)' }}>Most Demand:</strong><br />PGCP-AI (60% required)</p>
                <p style={{ marginBottom: '10px' }}><strong style={{ color: 'var(--neutral-dark)' }}>Only Online:</strong><br />PGCP-FBD (FinTech/Blockchain)</p>
                <p style={{ marginBottom: '10px' }}><strong style={{ color: 'var(--neutral-dark)' }}>Best for Hardware:</strong><br />PGCP-ESD & PGCP-VLSI</p>
                <p><strong style={{ color: 'var(--neutral-dark)' }}>Best Pune Centre:</strong><br />C-DAC ACTS (Main Centre)</p>
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
