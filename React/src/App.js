import React, { useState } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

function App() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const logoUrl = 'https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/WhatsApp%20Image%202025-12-24%20at%2010.23.29%20PM.jpeg';
  const bannerUrl = 'https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/ChatGPT%20Image%20Dec%2024,%202025,%2010_54_44%20PM.png';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('emails')
        .insert([{ email: email, created_at: new Date() }]);

      if (error) {
        // Check if it's a duplicate email error
        if (error.message && error.message.includes('duplicate')) {
          setMessage('This email is already registered. Redirecting to exam...');
          setMessageType('success');
          setTimeout(() => {
            window.location.href = '/CCATMOCK.html';
          }, 1500);
        } else {
          setMessage('Error saving email. Please try again.');
          setMessageType('error');
          console.error(error);
        }
      } else {
        setMessage('✓ Thank you! Redirecting to exam...');
        setMessageType('success');
        setEmail('');
        
        // Redirect to exam after 1.5 seconds
        setTimeout(() => {
          window.location.href = '/CCATMOCK.html';
        }, 1500);
      }
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="hero">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo-section">
              <img className="logo-image" src={logoUrl} alt="Datawiz6 logo" />
              <h1 className="logo">Datawiz6</h1>
            </div>
            <div className="nav-links">
              <a href="#about">About</a>
              <a href="#subscribe">Mock Test</a>
              <a href="#social">Follow</a>
            </div>
          </div>
        </nav>
        <div className="banner-container">
          <div
            className="banner-image"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />
          <div className="banner-overlay" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-glow hero-glow-3" />
        </div>
        <div className="hero-copy">
          <span className="hero-tag">Free Mock Test</span>
          <h1>Secure Your Free CDAC C-CAT Mock Test</h1>
          <p>Submit your email and get instant access to the exam with guided preparation.</p>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <h2>About This Channel</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                Datawiz6 is dedicated to making Data Science and Statistics accessible to everyone. 
                We provide in-depth tutorials, practical examples, and real-world applications to help 
                you master these essential skills.
              </p>
              <ul className="features">
                <li>📊 In-depth Data Science tutorials</li>
                <li>📈 Statistics fundamentals & advanced concepts</li>
                <li>💻 Python & R programming guides</li>
                <li>🎯 Real-world project implementations</li>
                <li>🚀 Career tips & opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Email Subscription Section */}
      <section id="subscribe" className="subscription">
        <div className="container">
          <h2>Free Mock Test Access</h2>
          <p>Enter your email for free mock test access and get instant entry to the exam.</p>
          
          <form className="email-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Your email for free mock test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Getting Access...' : 'Get Access'}
              </button>
            </div>
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Social Links Section */}
      <section id="social" className="social-section">
        <div className="container">
          <h2>Follow Us</h2>
          <div className="social-links">
            <a 
              href="https://www.youtube.com/@Datawiz6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-card youtube"
            >
              <div className="social-icon">
                <img
                  className="social-logo"
                  src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg"
                  alt="YouTube"
                />
              </div>
              <h3>YouTube</h3>
              <p>@Datawiz6</p>
              <span className="cta">Subscribe Now →</span>
            </a>

            <a 
              href="https://www.linkedin.com/in/datawiz6/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-card linkedin"
            >
              <div className="social-icon">
                <img
                  className="social-logo"
                  src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg"
                  alt="LinkedIn"
                />
              </div>
              <h3>LinkedIn</h3>
              <p>@datawiz6</p>
              <span className="cta">Connect →</span>
            </a>

            <a 
              href="mailto:allaboutstatistics19@gmail.com" 
              className="social-card email"
            >
              <div className="social-icon">
                <img
                  className="social-logo"
                  src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg"
                  alt="Gmail"
                />
              </div>
              <h3>Email</h3>
              <p>allaboutstatistics19@gmail.com</p>
              <span className="cta">Get in Touch →</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Datawiz6. All rights reserved.</p>
          <p>Made with ❤️ for Data Enthusiasts</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
