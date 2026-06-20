import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ProfileDropdown from '../components/ProfileDropdown'
import './WhatsHappeningBlog.css'

export default function WhatsHappeningBlog() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

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

      {/* Main Content */}
      <main className="mt-[72px] flex-grow whats-happening-container">
        {/* Hero Section */}
        <section className="hero">
          <div className="tag">📡 June 2026 Edition</div>
          <h1>What Is Currently <span>Happening in AI?</span></h1>
          <p className="subtitle">A simple, no-jargon guide to the biggest things going on in Artificial Intelligence right now.</p>
          <div className="meta">
            <span>📅 June 2026</span>
            <span>⏱ 6 min read</span>
            <span>🤖 Tech &amp; AI</span>
          </div>
        </section>

        {/* Content Container */}
        <div className="container">
          <div className="intro-box">
            AI is everywhere right now — in your phone, your apps, your search results, and even your doctor's office. But with so much happening so fast, it can be hard to keep up. This article breaks it all down in plain English. No technical degree required!
          </div>

          {/* Section 1 */}
          <div className="section">
            <div className="section-label">01 — The big picture</div>
            <h2>More people than ever are using AI</h2>
            <p>Let's start with something that shows just how big AI has become. A recent global report found that nearly <span className="highlight">18% of the world's working-age population</span> is now actively using AI tools — that's about 1 in every 5.5 working adults on the planet.</p>
            <p>And the number keeps going up. That's up from 16.3% just a few months ago. Countries like South Korea, Japan, and Thailand are seeing some of the biggest jumps in AI adoption.</p>

            <div className="stat-grid">
              <div className="stat-card">
                <span className="num">17.8%</span>
                <div className="label">of working adults use AI globally</div>
              </div>
              <div className="stat-card">
                <span className="num">26</span>
                <div className="label">countries where 30%+ people use AI</div>
              </div>
              <div className="stat-card">
                <span className="num">500+</span>
                <div className="label">AI models available to developers</div>
              </div>
            </div>

            <p>This isn't just tech nerds anymore. Everyday people are using AI to write emails, summarise documents, generate images, get medical advice, learn new languages, and so much more.</p>
          </div>

          <hr className="divider" />

          {/* Section 2 */}
          <div className="section">
            <div className="section-label">02 — The AI race</div>
            <h2>The big AI models: who's who right now</h2>
            <p>If you've heard names like ChatGPT, Gemini, or Claude thrown around, you might be wondering — what are these exactly? They are <span className="highlight">large AI models</span>, essentially very powerful AI "brains" trained on huge amounts of data. Each company is racing to make theirs the best.</p>
            <p>Here's a quick look at who the major players are in mid-2026:</p>

            <div className="model-cards">
              <div className="model-card">
                <span className="badge badge-anthropic">Anthropic</span>
                <h3>Fabel 5</h3>
                <p>Currently ranked #1 overall on major benchmarks. Great for writing, coding, and complex reasoning tasks.</p>
              </div>
              <div className="model-card">
                <span className="badge badge-openai">OpenAI</span>
                <h3>GPT-5.5</h3>
                <p>A close second overall, and considered the best AI for creative writing. Powers ChatGPT, used by hundreds of millions of people.</p>
              </div>
              <div className="model-card">
                <span className="badge badge-google">Google</span>
                <h3>Gemini 3.5</h3>
                <p>Google's latest AI — launched at Google I/O 2026. Strong at reasoning, data analysis, and is deeply integrated into Google's products.</p>
              </div>
              <div className="model-card">
                <span className="badge badge-meta">xAI / Meta</span>
                <h3>Grok &amp; Llama</h3>
                <p>Grok is Elon Musk's AI (with great tool-use), while Meta's Llama models are open-source, meaning anyone can download and use them.</p>
              </div>
            </div>

            <p>The competition between these companies is intense, and new models are launching almost every month. In fact, June 2026 is expected to see some major new releases that could shake up the rankings all over again.</p>
          </div>

          <hr className="divider" />

          {/* Section 3 */}
          <div className="section">
            <div className="section-label">03 — The hottest trend</div>
            <h2>AI Agents: AI that actually does things for you</h2>
            <p>Up until recently, AI was mostly a <em>question-and-answer</em> tool. You ask it something, it replies. But the biggest shift happening right now is the rise of <span className="highlight">AI agents</span> — AI that can take real actions on your behalf.</p>

            <div className="callout">
              <p><strong>Think of it like this:</strong> Old AI was like a very smart encyclopedia. New "agentic" AI is like a smart assistant that can actually open your computer, book your flight, send your emails, and file your taxes — all on its own.</p>
            </div>

            <p>Here's what's making headlines:</p>

            <ul className="list-clean">
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>OpenAI launched Workspace Agents</strong> — AI agents that your whole team can share. They can run in the background, work across different apps, and remember what they've done before.</li>
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>Google's Gemini Enterprise Agent Platform</strong> — Released at their big annual developer event, this lets businesses build AI agents that run inside their existing workflows.</li>
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>AI agents can now talk to each other</strong> — Different AI agents from different companies are starting to be able to communicate and collaborate, like a team of robot workers handing tasks between themselves.</li>
            </ul>

            <p>This "agentic era" is being called the next big leap for AI — bigger than the original ChatGPT moment in late 2022.</p>
          </div>

          <hr className="divider" />

          {/* Section 4 */}
          <div className="section">
            <div className="section-label">04 — In the workplace</div>
            <h2>AI is changing how we work — fast</h2>
            <p>One of the most concrete impacts of AI right now is in the workplace. Companies of all sizes are adopting AI to get more done, faster.</p>

            <ul className="list-clean">
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>Coding is being transformed.</strong> AI tools can now help write, test, and review software code. Tasks that used to take developers weeks can sometimes be done in hours. AI-assisted coding tools are now the norm, not the exception.</li>
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>Banks are going all-in.</strong> JPMorgan Chase has officially moved AI from "experimental" to "core infrastructure" — with a budget of nearly $20 billion and 2,000 employees dedicated purely to AI development.</li>
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>New jobs are being created.</strong> Roles like "AI prompt engineer," "model trainer," and "AI governance specialist" are growing rapidly, even as some traditional roles change.</li>
            </ul>

            <p>The bottom line: ignoring AI in your career right now is a bit like ignoring the internet in 1999. It's not going away — it's accelerating.</p>
          </div>

          <hr className="divider" />

          {/* Section 5 */}
          <div className="section">
            <div className="section-label">05 — Science &amp; health</div>
            <h2>AI as a scientist and doctor's helper</h2>
            <p>Beyond chatbots and productivity tools, AI is starting to make a real impact in science and medicine — and this is arguably where the most exciting things are happening.</p>

            <ul className="list-clean">
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>AI in scientific research.</strong> AI is no longer just summarising research papers — it's generating new hypotheses, suggesting experiments, and even running parts of them. Microsoft researchers describe AI as becoming a true "lab assistant" for scientists.</li>
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>Healthcare.</strong> AI is being used to help close gaps in medical care, especially in areas where there aren't enough doctors. It can analyse scans, suggest diagnoses, and help doctors make faster decisions.</li>
              <li><span className="dot"></span><strong style={{ color: 'var(--primary-dk)' }}>Climate and materials science.</strong> AI is accelerating breakthroughs in climate modelling and designing new materials — work that could take human researchers years is being done in days.</li>
            </ul>
          </div>

          <hr className="divider" />

          {/* Section 6 */}
          <div className="section">
            <div className="section-label">06 — Open source</div>
            <h2>AI is becoming more open and accessible</h2>
            <p>For a long time, the most powerful AI was locked behind expensive subscriptions and big company servers. That's starting to change.</p>
            <p>Open-source AI models — ones that anyone can download and use for free — are rapidly catching up to the paid models in quality. Companies like Meta (with their "Llama" models) and others are releasing powerful AI that individuals, small startups, and researchers can customise and build on.</p>

            <div className="callout">
              <p><strong>What this means for you:</strong> AI tools that were only available to big corporations a year ago are now being packaged into apps and services that regular people can use for free or very cheaply. This democratisation of AI is accelerating fast.</p>
            </div>
          </div>

          <hr className="divider" />

          {/* Section 7 */}
          <div className="section">
            <div className="section-label">07 — The concerns</div>
            <h2>It's not all good news — here are the worries</h2>
            <p>With all this excitement, there are also very real concerns being discussed. It's important to be honest about these.</p>

            <div className="worry-grid">
              <div className="worry-card">
                <div className="icon">💼</div>
                <h4>Jobs and displacement</h4>
                <p>Some jobs are being automated. While new jobs are created, the transition can be tough for people whose roles are affected.</p>
              </div>
              <div className="worry-card">
                <div className="icon">🧪</div>
                <h4>Accuracy and "hallucinations"</h4>
                <p>AI can confidently say wrong things. Studies show major AI models still fail on accuracy in surprising ways, especially for complex questions.</p>
              </div>
              <div className="worry-card">
                <div className="icon">🔒</div>
                <h4>Privacy and data</h4>
                <p>Governments and regulators around the world are debating how to keep AI companies from misusing personal data.</p>
              </div>
              <div className="worry-card">
                <div className="icon">⚖️</div>
                <h4>Regulation is lagging</h4>
                <p>AI is moving faster than the laws designed to govern it. The UK and EU are among the first to push through serious AI regulations.</p>
              </div>
            </div>

            <p>The good news is that awareness of these issues is growing. More AI companies are hiring ethicists, publishing safety research, and working with governments — even if progress is slow.</p>
          </div>

          <hr className="divider" />

          {/* Section 8 */}
          <div className="section">
            <div className="section-label">08 — What's next</div>
            <h2>What should we expect in the next few months?</h2>
            <p>The pace of AI development shows no sign of slowing down. Here's what's coming:</p>

            <ul className="list-clean">
              <li><span className="dot"></span>Several major new AI models are expected to launch in June and July 2026 — including upgrades from OpenAI, Google, and Anthropic that could be significantly more capable.</li>
              <li><span className="dot"></span>AI on your personal devices (your phone and laptop) is getting smarter, meaning powerful AI that works offline without sending your data to a server.</li>
              <li><span className="dot"></span>AI in personal health is expanding — Google launched a dedicated Google Health app in May 2026, and AI-powered wearables are becoming more sophisticated.</li>
              <li><span className="dot"></span>More governments will introduce AI laws and regulations — expect this to be a big political topic for the rest of 2026.</li>
            </ul>
          </div>

          {/* Conclusion Box */}
          <div className="conclusion-box">
            <h2>The Bottom Line 🤖</h2>
            <p>AI in 2026 is no longer a futuristic concept — it's a real, everyday force reshaping work, science, healthcare, and creativity. Whether you're excited, nervous, or just curious, one thing is clear: understanding what AI is and how it works is now a life skill, just like knowing how to use a smartphone. Stay curious, stay informed, and keep watching this space — because things are moving fast.</p>
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
