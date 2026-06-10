import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './AiCoursesBlog.css'

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

export default function AiCoursesBlog() {
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
      q: "Do I need any prior knowledge to start these courses?",
      a: "Not for most of them! Databricks, IBM, Google SkillUp, and Anthropic's courses are designed for absolute beginners — no coding or math background needed. For CS50, Google MLCC, and Hugging Face, basic Python knowledge helps but isn't mandatory to start."
    },
    {
      q: "Are these certificates recognized by employers?",
      a: "Yes — especially Google's and Harvard's certificates. IBM's digital badges are also well-recognized on LinkedIn. That said, what employers look for more than the certificate is what you can actually do. Build small projects alongside your learning to make your profile stand out."
    },
    {
      q: "Which course should I do first as a complete beginner?",
      a: "Start with either IBM AI Fundamentals or the Google × Simplilearn SkillUp course. Both are free, beginner-friendly, and give you a certificate in under 10 hours. Once you're comfortable, move to Google's ML Crash Course to get into hands-on learning."
    },
    {
      q: "Can these courses help me crack CDAC C-CAT?",
      a: "Indirectly, yes. While C-CAT doesn't have a dedicated AI section, studying AI strengthens your logical reasoning, data structures thinking, and algorithmic intuition — all tested in Sections A and B. For direct preparation, also check out DataWiz's mock tests at datawiz.in!"
    },
    {
      q: "How long will it take to complete all 8 courses?",
      a: "Roughly 3–6 months if you do 1–2 hours per day. The beginner courses (IBM, Google SkillUp, Databricks) take 5–10 hours each. CS50 and MIT's deep learning course can take 4–8 weeks at a steady pace. You don't have to do all 8 — pick based on your goals."
    }
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant">
        <div className="flex justify-between items-center px-gutter py-4 max-w-container-max mx-auto">
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
      <main className="mt-[72px] flex-grow blog-container">
        <div className="blog">
          {/* Hero Banner */}
          <header className="hero-banner">
            <div className="hero-badge">📚 2026 AI Learning Guide</div>
            <h1>The Only <em>Free AI Course</em> List You'll Need in 2026</h1>
            <p className="hero-intro">8 world-class AI courses from Google, IBM, Harvard, MIT & Anthropic — curated so you don't waste a single hour.</p>
            <div className="hero-meta">
              <span>✍️ DataWiz Team</span>
              <span>📅 June 2026</span>
              <span>⏱ 8 min read</span>
              <span>🎓 8 courses reviewed</span>
            </div>
          </header>

          {/* Hero Illustration */}
          <div className="hero-illustration">
            <svg viewBox="0 0 760 220" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#005f5f"/>
                  <stop offset="100%" stopColor="#008080"/>
                </linearGradient>
              </defs>
              <rect width="760" height="220" fill="url(#bg)"/>

              {/* Grid lines */}
              <line x1="0" y1="55" x2="760" y2="55" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <line x1="0" y1="110" x2="760" y2="110" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <line x1="0" y1="165" x2="760" y2="165" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <line x1="152" y1="0" x2="152" y2="220" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <line x1="304" y1="0" x2="304" y2="220" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <line x1="456" y1="0" x2="456" y2="220" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <line x1="608" y1="0" x2="608" y2="220" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

              {/* Central brain circle */}
              <circle cx="380" cy="110" r="68" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
              <circle cx="380" cy="110" r="44" fill="none" stroke="rgba(255,191,0,0.3)" strokeWidth="1.5"/>
              <circle cx="380" cy="110" r="22" fill="rgba(255,191,0,0.2)"/>
              <text x="380" y="115" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Inter,sans-serif">AI</text>

              {/* Nodes around brain */}
              <circle cx="210" cy="60"  r="10" fill="rgba(255,255,255,0.75)"/>
              <circle cx="550" cy="60"  r="10" fill="rgba(255,255,255,0.75)"/>
              <circle cx="185" cy="145" r="10" fill="rgba(255,191,0,0.9)"/>
              <circle cx="575" cy="145" r="10" fill="rgba(255,191,0,0.9)"/>
              <circle cx="290" cy="175" r="10" fill="rgba(255,255,255,0.75)"/>
              <circle cx="470" cy="175" r="10" fill="rgba(255,255,255,0.75)"/>
              <circle cx="310" cy="42"  r="8"  fill="rgba(169,96,57,0.85)"/>
              <circle cx="450" cy="42"  r="8"  fill="rgba(169,96,57,0.85)"/>

              {/* Connection lines */}
              <line x1="210" y1="60"  x2="345" y2="94"  stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
              <line x1="550" y1="60"  x2="415" y2="94"  stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
              <line x1="185" y1="145" x2="343" y2="117" stroke="rgba(255,191,0,0.4)"   strokeWidth="1.5"/>
              <line x1="575" y1="145" x2="417" y2="117" stroke="rgba(255,191,0,0.4)"   strokeWidth="1.5"/>
              <line x1="290" y1="175" x2="363" y2="128" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
              <line x1="470" y1="175" x2="397" y2="128" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
              <line x1="310" y1="42"  x2="366" y2="90"  stroke="rgba(169,96,57,0.45)"  strokeWidth="1.5"/>
              <line x1="450" y1="42"  x2="394" y2="90"  stroke="rgba(169,96,57,0.45)"  strokeWidth="1.5"/>

              {/* Node labels */}
              <text x="210" y="47"  textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="Inter,sans-serif">IBM</text>
              <text x="550" y="47"  textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="Inter,sans-serif">Google</text>
              <text x="185" y="165" textAnchor="middle" fill="rgba(255,191,0,0.85)"  fontSize="9" fontFamily="Inter,sans-serif">MIT</text>
              <text x="575" y="165" textAnchor="middle" fill="rgba(255,191,0,0.85)"  fontSize="9" fontFamily="Inter,sans-serif">HuggingFace</text>
              <text x="290" y="193" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="Inter,sans-serif">Harvard</text>
              <text x="470" y="193" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="Inter,sans-serif">Anthropic</text>
              <text x="310" y="36"  textAnchor="middle" fill="rgba(169,96,57,0.9)"   fontSize="9" fontFamily="Inter,sans-serif">Databricks</text>
              <text x="450" y="36"  textAnchor="middle" fill="rgba(169,96,57,0.9)"   fontSize="9" fontFamily="Inter,sans-serif">Simplilearn</text>

              {/* Subtitle */}
              <text x="380" y="208" text-anchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="Inter,sans-serif">Top Free AI Courses of 2026 — curated by DataWiz</text>
            </svg>
          </div>

          {/* Intro Hook */}
          <p className="intro-hook">
            Here's the uncomfortable truth: AI is not the future anymore — it's the present. And while everyone is talking about it, very few people are actually <em>learning</em> it. In 2026, you don't need a degree or ₹50,000 to get started. You just need the right course. We've done the research — here are the 8 best free AI courses, and what makes each one worth your time.
          </p>

          <p>Whether you're a CDAC aspirant, a working professional, or a curious student — AI literacy is becoming as important as knowing how to use a spreadsheet. The world's best universities and tech giants have made their courses completely free. Let's break them down one by one.</p>

          {/* Section 1: Courses */}
          <h2>🎓 The 8 Best Free AI Courses in 2026</h2>

          <div className="course-list">
            {/* 1 */}
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon" style={{ background: '#fff3e0' }}>🔥</div>
                <div className="course-title-block">
                  <div className="course-provider">Databricks</div>
                  <h3>Master the Fundamentals of Generative AI</h3>
                </div>
              </div>
              <p className="course-desc">Generative AI — the technology behind ChatGPT and image generators — explained from first principles. Databricks' course takes you from "what even is GenAI?" to understanding LLMs, diffusion models, and real-world enterprise use cases. Perfect if you want to understand how tools like ChatGPT actually work under the hood.</p>
              <div className="tags">
                <span className="tag tag-green">✅ Free</span>
                <span className="tag tag-amber">Beginner</span>
                <span className="tag tag-teal">GenAI</span>
                <span className="tag tag-teal">LLMs</span>
              </div>
              <a href="https://www.databricks.com/learn/training/generative-ai-fundamentals-accreditation" target="_blank" rel="noopener noreferrer" className="course-link">Start Course →</a>
            </div>

            {/* 2 */}
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon" style={{ background: '#e8f5e9' }}>🌐</div>
                <div className="course-title-block">
                  <div className="course-provider">Google × Simplilearn</div>
                  <h3>Free Generative AI Course – SkillUp</h3>
                </div>
              </div>
              <p className="course-desc">A Google-backed course delivered via Simplilearn's SkillUp platform. Covers generative AI concepts, prompt engineering, and practical applications of tools like Bard and Gemini. You get a certificate from Google upon completion — excellent for your LinkedIn and resume. Highly recommended before any tech interview in 2026.</p>
              <div className="tags">
                <span className="tag tag-green">✅ Free</span>
                <span className="tag tag-amber">Beginner</span>
                <span className="tag tag-teal">Google Certificate</span>
                <span className="tag tag-teal">Prompt Engineering</span>
              </div>
              <a href="https://www.simplilearn.com/free-generative-ai-course-skillup" target="_blank" rel="noopener noreferrer" className="course-link">Start Course →</a>
            </div>

            {/* 3 */}
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon" style={{ background: '#e3f2fd' }}>🤖</div>
                <div className="course-title-block">
                  <div className="course-provider">IBM</div>
                  <h3>Artificial Intelligence Fundamentals</h3>
                </div>
              </div>
              <p className="course-desc">IBM is one of the oldest names in enterprise AI. Their AI Fundamentals course on SkillsBuild is structured, credentialed, and surprisingly beginner-friendly. It covers machine learning, neural networks, natural language processing, and computer vision — all without requiring a single line of code. Ideal for non-technical learners who want a solid foundation.</p>
              <div className="tags">
                <span className="tag tag-green">✅ Free</span>
                <span className="tag tag-amber">Beginner</span>
                <span className="tag tag-teal">IBM Badge</span>
                <span className="tag tag-teal">No Code Required</span>
              </div>
              <a href="https://skills.yourlearning.ibm.com/activity/ILB-DNRPWDGQGMMY7GGD" target="_blank" rel="noopener noreferrer" className="course-link">Start Course →</a>
            </div>

            {/* 4 */}
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon" style={{ background: '#fce4ec' }}>📊</div>
                <div className="course-title-block">
                  <div className="course-provider">Google</div>
                  <h3>Machine Learning Crash Course</h3>
                </div>
              </div>
              <p className="course-desc">This is where things get real. Google's MLCC has been used internally to train thousands of engineers. It introduces core ML concepts — loss functions, gradient descent, neural networks — with hands-on exercises in TensorFlow. If you're preparing for a data science role or CDAC C-CAT, the concepts covered here will directly show up in your interviews and exams.</p>
              <div className="tags">
                <span className="tag tag-green">✅ Free</span>
                <span className="tag tag-purple">Intermediate</span>
                <span className="tag tag-teal">TensorFlow</span>
                <span className="tag tag-teal">Hands-on</span>
              </div>
              <a href="https://developers.google.com/machine-learning/crash-course" target="_blank" rel="noopener noreferrer" className="course-link">Start Course →</a>
            </div>

            {/* 5 */}
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon" style={{ background: '#ede7f6' }}>🏛️</div>
                <div className="course-title-block">
                  <div className="course-provider">Harvard (CS50)</div>
                  <h3>CS50's Introduction to AI with Python</h3>
                </div>
              </div>
              <p className="course-desc">Harvard's CS50 is legendary. Their AI with Python course covers search algorithms, knowledge representation, machine learning, neural networks, and natural language processing — all using Python. It's project-heavy: you'll build real AI programs, not just watch videos. One of the most respected free certifications you can put on your resume in the tech world.</p>
              <div className="tags">
                <span className="tag tag-green">✅ Free</span>
                <span className="tag tag-purple">Intermediate</span>
                <span className="tag tag-teal">Python</span>
                <span className="tag tag-teal">Harvard Certificate</span>
              </div>
              <a href="https://cs50.harvard.edu/ai/" target="_blank" rel="noopener noreferrer" className="course-link">Start Course →</a>
            </div>

            {/* 6 */}
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon" style={{ background: '#fff8e1' }}>🤗</div>
                <div className="course-title-block">
                  <div className="course-provider">Hugging Face</div>
                  <h3>NLP and LLM Course</h3>
                </div>
              </div>
              <p className="course-desc">Hugging Face is the GitHub of AI models — if you want to work with language models, this is the course. You'll learn how to use transformers, fine-tune pre-trained models, and build NLP pipelines. This is the most practical course on this list for anyone who wants to actually build AI applications and not just understand the theory.</p>
              <div className="tags">
                <span className="tag tag-green">✅ Free</span>
                <span className="tag tag-purple">Intermediate</span>
                <span className="tag tag-teal">Transformers</span>
                <span className="tag tag-teal">Fine-tuning</span>
                <span className="tag tag-teal">LLMs</span>
              </div>
              <a href="https://huggingface.co/learn/nlp-course" target="_blank" rel="noopener noreferrer" className="course-link">Start Course →</a>
            </div>

            {/* 7 */}
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon" style={{ background: '#e8f5e9' }}>🧠</div>
                <div className="course-title-block">
                  <div className="course-provider">MIT</div>
                  <h3>Introduction to Deep Learning (6.S191)</h3>
                </div>
              </div>
              <p className="course-desc">MIT's 6.S191 is the gold standard for deep learning education. Lectures delivered by MIT researchers cover convolutional neural networks, recurrent networks, reinforcement learning, and generative models using TensorFlow and PyTorch. Fair warning: this one is challenging — but if you finish it, you'll have university-level deep learning knowledge, completely free.</p>
              <div className="tags">
                <span className="tag tag-green">✅ Free</span>
                <span className="tag tag-red">Advanced</span>
                <span className="tag tag-teal">PyTorch</span>
                <span className="tag tag-teal">Neural Networks</span>
              </div>
              <a href="http://introtodeeplearning.com" target="_blank" rel="noopener noreferrer" className="course-link">Start Course →</a>
            </div>

            {/* 8 */}
            <div className="course-card">
              <div className="course-header">
                <div className="course-icon" style={{ background: '#fce4ec' }}>✨</div>
                <div className="course-title-block">
                  <div className="course-provider">Anthropic</div>
                  <h3>Anthropic Free Courses (AI Safety + Prompt Engineering)</h3>
                </div>
              </div>
              <p className="course-desc">Anthropic — the company behind Claude AI — offers free educational resources focused on responsible AI development, AI safety, and prompt engineering. What makes this special is the focus on AI alignment and safety, not just capability. In a world where AI ethics is becoming a core skill, this gives you a perspective that very few free resources offer. Unique, timely, and important.</p>
              <div className="tags">
                <span className="tag tag-green">✅ Free</span>
                <span className="tag tag-amber">Beginner</span>
                <span className="tag tag-teal">AI Safety</span>
                <span className="tag tag-teal">Prompt Engineering</span>
              </div>
              <a href="https://www.anthropic.com/education" target="_blank" rel="noopener noreferrer" className="course-link">Start Course →</a>
            </div>
          </div>

          {/* Learning Path Strip */}
          <div className="visual-strip">
            <div className="strip-icon">🗺️</div>
            <div>
              <h3>Suggested Learning Path</h3>
              <p>Start with <strong>IBM + Google SkillUp</strong> (fundamentals) → Move to <strong>CS50 + Google MLCC</strong> (applied) → Level up with <strong>Hugging Face + MIT</strong> (advanced). Use Databricks and Anthropic for specialization alongside.</p>
            </div>
          </div>

          {/* Section 2: Comparison Table */}
          <h2>📊 Quick Comparison Table</h2>
          <p>Not sure where to start? Here's an at-a-glance comparison to help you pick the right first course.</p>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Provider</th>
                  <th>Level</th>
                  <th>Coding?</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>GenAI Fundamentals</td><td>Databricks</td><td>Beginner</td><td>❌</td><td className="check">✔ Yes</td></tr>
                <tr><td>Free GenAI SkillUp</td><td>Google × Simplilearn</td><td>Beginner</td><td>❌</td><td className="check">✔ Google</td></tr>
                <tr><td>AI Fundamentals</td><td>IBM</td><td>Beginner</td><td>❌</td><td className="check">✔ IBM Badge</td></tr>
                <tr><td>ML Crash Course</td><td>Google</td><td>Intermediate</td><td className="check">✔ TF</td><td>Limited</td></tr>
                <tr><td>CS50 AI + Python</td><td>Harvard</td><td>Intermediate</td><td className="check">✔ Python</td><td className="check">✔ Harvard</td></tr>
                <tr><td>NLP / LLM Course</td><td>Hugging Face</td><td>Intermediate</td><td className="check">✔ Python</td><td>Limited</td></tr>
                <tr><td>Intro to Deep Learning</td><td>MIT</td><td>Advanced</td><td className="check">✔ TF/PyTorch</td><td>❌</td></tr>
                <tr><td>AI Safety + Prompting</td><td>Anthropic</td><td>Beginner</td><td>❌</td><td>Limited</td></tr>
              </tbody>
            </table>
          </div>

          {/* Callout Tip */}
          <div className="callout">
            <div className="callout-emoji">💡</div>
            <div className="callout-body">
              <strong>Pro Tip from DataWiz</strong>
              <p>If you're preparing for CDAC C-CAT, start with IBM AI Fundamentals and Google's ML Crash Course. These directly strengthen your problem-solving mindset and give you exposure to concepts tested in Section A. After your exam, revisit Hugging Face and MIT for deeper AI knowledge.</p>
            </div>
          </div>

          {/* Section 3: Why Learn AI */}
          <h2>🤔 Why Learn AI in 2026?</h2>
          <p>The question in 2026 isn't <em>"should I learn AI?"</em> — it's <em>"how quickly can I start?"</em> Here's what's happening in the real world:</p>

          <div className="stat-block">
            <div className="stat-num">35%<span>↑</span></div>
            <div className="stat-label"><strong>AI jobs are growing year-over-year.</strong> India alone is expected to need 1 million AI-skilled professionals by 2026. Companies like TCS, Infosys, Wipro, and startups are actively hiring — and free certifications from Google, IBM, and Harvard are being accepted as valid credentials.</div>
          </div>

          <div className="visual-strip" style={{ marginTop: '1rem' }}>
            <div className="strip-icon">🎯</div>
            <div>
              <h3>Relevant for CDAC C-CAT Too</h3>
              <p>While C-CAT doesn't have a dedicated AI section, studying AI strengthens your logical reasoning, data structures thinking, and algorithmic intuition — all tested in Sections A and B. A bonus that pays off both in the exam and your career.</p>
            </div>
          </div>

          {/* Section 4: FAQ */}
          <h2>❓ Frequently Asked Questions</h2>

          <div className="faq">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
                <button className="faq-btn" onClick={() => toggleFaq(index)}>
                  {faq.q}
                  <span className="faq-arrow">▼</span>
                </button>
                <div className="faq-answer">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Block */}
          <div className="cta-block">
            <h2>Ready to Level Up Your Career?</h2>
            <p>While you're learning AI, don't forget to strengthen your core CS fundamentals — especially if CDAC is on your roadmap. DataWiz offers India's most focused C-CAT mock tests, covering Sections A & B in depth.</p>
            <div className="cta-buttons">
              <a href="https://www.datawiz.in" className="btn-primary">Get Free Mock Test →</a>
              <a href="https://www.youtube.com/@Datawiz6" target="_blank" rel="noopener noreferrer" className="btn-outline">Watch on YouTube</a>
            </div>
          </div>
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
