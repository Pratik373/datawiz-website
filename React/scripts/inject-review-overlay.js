const fs = require('fs');
const path = require('path');

const files = [
  { name: 'CCATMOCK.html', id: 'free-ccat-mock-test' },
  { name: 'CCAT_Mock_Test_Set1.html', id: 'premium-ccat-set-1' },
  { name: 'CCAT_Mock_Test_Set2.html', id: 'premium-ccat-set-2' },
  { name: 'CCAT_Mock_Test_Set3.html', id: 'premium-ccat-set-3' },
  { name: 'CCAT_Mock_Test_Set4.html', id: 'premium-ccat-set-4' },
  { name: 'CCAT_Mock_Test_Set5.html', id: 'premium-ccat-set-5' },
  { name: 'CCAT_Mock_Test_Set6.html', id: 'premium-ccat-set-6' },
  { name: 'CCAT_Mock_Test_Set7.html', id: 'premium-ccat-set-7' },
  { name: 'CCAT_Mock_Test_Set8.html', id: 'premium-ccat-set-8' },
  { name: 'CCAT_Mock_Test_Set9.html', id: 'premium-ccat-set-9' },
  { name: 'CCAT_Mock_Test_Set10.html', id: 'premium-ccat-set-10' }
];

const publicDir = path.join(__dirname, '..', 'public');

files.forEach(({ name, id }) => {
  const filePath = path.join(publicDir, name);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Insert Clear All Answers button in the header beside the timers if not present
  const timerBRegex = /<div\s+id="timerB"[^>]*>[^<]*<\/div>/i;
  const clearBtnTag = '<button id="clearAllBtn" onclick="clearAllAnswers()" style="display:none;background:var(--blue);padding:8px 15px;font-size:14px;margin-left:4px;font-weight:bold;color:white;border:none;border-radius:7px;cursor:pointer;">Clear Section Answers</button>';
  
  if (content.includes('id="clearAllBtn"')) {
    content = content.replace(/<button\s+id="clearAllBtn"[^>]*>[^<]*<\/button>/gi, clearBtnTag);
  } else if (content.match(timerBRegex)) {
    content = content.replace(timerBRegex, '$&\n        ' + clearBtnTag);
  }

  // Inject clear button visibility toggles
  if (!content.includes('clearAllBtn.style.display = "inline-block"')) {
    content = content.replace(
      /function\s+startExam\(\)\s*\{([\s\S]*?)examStarted\s*=\s*true;/gi,
      'function startExam(){\n    examStarted = true;\n    const clearBtn = document.getElementById("clearAllBtn");\n    if (clearBtn) clearBtn.style.display = "inline-block";'
    );
  }

  if (!content.includes('clearAllBtn.style.display = "none"')) {
    content = content.replace(
      /function\s+reattemptExam\(\)\s*\{/gi,
      'function reattemptExam(){\n    const clearBtn = document.getElementById("clearAllBtn");\n    if (clearBtn) clearBtn.style.display = "none";'
    );
    content = content.replace(
      /function\s+submitExam\(\)\s*\{([\s\S]*?)if\s*\(\s*examSubmitted\s*\)\s*return;\s*examSubmitted\s*=\s*true;/gi,
      'function submitExam(){\n    if(examSubmitted) return;\n    examSubmitted = true;\n    const clearBtn = document.getElementById("clearAllBtn");\n    if (clearBtn) clearBtn.style.display = "none";'
    );
  }

  const scriptToInject = `
<!-- Supabase CDN and Review Interceptor -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
(function() {
  const originalSubmitExam = window.submitExam;
  if (!originalSubmitExam) return;

  const testId = '${id}';

  window.clearAllAnswers = function() {
    const activeSec = (typeof currentSection !== 'undefined') ? currentSection : 'A';
    if (confirm("Are you sure you want to clear all Section " + activeSec + " answers?")) {
      questions.forEach(q => {
        if (q.section === activeSec) {
          localStorage.removeItem("ccat_" + testId + "_q" + q.id);
        }
      });
      if (typeof renderQuestions === 'function') renderQuestions();
      if (typeof renderNav === 'function') renderNav();
    }
  };

  // Create style element for overlay
  const style = document.createElement('style');
  style.textContent = \`
    .review-overlay-container {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .review-card {
      background: white !important;
      border-radius: 16px !important;
      width: 100% !important;
      max-width: 440px !important;
      padding: 28px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      text-align: center !important;
      border: 1px solid #e2e8f0 !important;
      animation: reviewFadeIn 0.3s ease-out;
    }
    @keyframes reviewFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .review-icon-wrap {
      width: 64px !important;
      height: 64px !important;
      background: #f0fdf4 !important;
      color: #15803d !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 auto 16px !important;
    }
    .review-icon {
      font-size: 32px !important;
      font-weight: bold !important;
    }
    .review-title {
      font-size: 22px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0 0 8px 0 !important;
    }
    .review-subtitle {
      font-size: 14px !important;
      color: #475569 !important;
      line-height: 1.5 !important;
      margin: 0 0 20px 0 !important;
    }
    .stars-row {
      display: flex !important;
      justify-content: center !important;
      gap: 12px !important;
      margin-bottom: 20px !important;
    }
    .star-btn {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      cursor: pointer !important;
      font-size: 36px !important;
      color: #cbd5e1 !important;
      padding: 0 !important;
      margin: 0 !important;
      width: auto !important;
      height: auto !important;
      min-width: 0 !important;
      transition: transform 0.1s, color 0.1s !important;
    }
    .star-btn:hover,
    .star-btn:focus,
    .star-btn:active {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      transform: scale(1.1) !important;
      color: #cbd5e1 !important;
    }
    .star-btn.active {
      color: #eab308 !important;
    }
    .star-btn.active:hover,
    .star-btn.active:focus,
    .star-btn.active:active {
      color: #eab308 !important;
    }
    .review-textarea {
      width: 100% !important;
      height: 100px !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 12px !important;
      padding: 12px !important;
      font-size: 14px !important;
      resize: none !important;
      outline: none !important;
      margin-bottom: 12px !important;
      transition: border-color 0.2s !important;
      background: white !important;
      color: #0f172a !important;
    }
    .review-textarea:focus {
      border-color: #1769d2 !important;
    }
    .review-error {
      color: #b42318 !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      margin: -6px 0 12px !important;
      text-align: left !important;
    }
    .review-btn-row {
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
    }
    .review-submit-btn {
      background: #1769d2 !important;
      color: white !important;
      border: none !important;
      border-radius: 9999px !important;
      padding: 12px !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: opacity 0.2s !important;
      width: 100% !important;
    }
    .review-submit-btn:hover {
      background: #0d55b5 !important;
    }
    .review-skip-btn {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      color: #475569 !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      text-decoration: underline !important;
      width: 100% !important;
      text-align: center !important;
      padding: 4px !important;
    }
    .review-skip-btn:hover {
      background: transparent !important;
      color: #0f172a !important;
      text-decoration: underline !important;
    }
  \`;
  document.head.appendChild(style);

  window.submitExam = async function() {
    // Call the original exam submit logic to compute result
    originalSubmitExam();

    const resultScreen = document.getElementById("resultScreen");

    // Initialize Supabase Client
    let supabaseClient = null;
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(
        'https://uoqfnvrdbicbepjxapcf.supabase.co',
        'sb_publishable_msdaGPOf8i6-RbBzziSVpg_NWstOnT1'
      );
    }

    let user = null;
    let alreadyReviewed = false;

    if (supabaseClient) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        user = session?.user;
        if (user) {
          const { data } = await supabaseClient
            .from('reviews')
            .select('id')
            .eq('user_id', user.id)
            .eq('test_id', testId)
            .maybeSingle();
          if (data) {
            alreadyReviewed = true;
          }
        }
      } catch (err) {
        console.error('Error checking review:', err);
      }
    }

    if (alreadyReviewed || !user) {
      if (resultScreen) {
        resultScreen.style.display = "block";
      }
      localStorage.removeItem('ccat_test_completed');
      localStorage.removeItem('ccat_test_completed_id');
      return;
    }

    // Hide result screen immediately
    if (resultScreen) {
      resultScreen.style.display = "none";
    }

    // Create the overlay DOM elements
    const overlay = document.createElement('div');
    overlay.className = 'review-overlay-container';
    overlay.innerHTML = \`
      <div class="review-card">
        <div class="review-icon-wrap">
          <span class="review-icon">✍</span>
        </div>
        <h2 class="review-title">Submit Test Review</h2>
        <p class="review-subtitle">
          Please leave a quick review of your experience. Your feedback helps us improve the quality of our mock tests.
        </p>
        <div class="stars-row">
          <button type="button" class="star-btn active" data-star="1">★</button>
          <button type="button" class="star-btn active" data-star="2">★</button>
          <button type="button" class="star-btn active" data-star="3">★</button>
          <button type="button" class="star-btn active" data-star="4">★</button>
          <button type="button" class="star-btn active" data-star="5">★</button>
        </div>
        <textarea 
          class="review-textarea" 
          placeholder="Write your review here (minimum 10 characters)..."
        ></textarea>
        <div class="review-error" style="display:none"></div>
        <div class="review-btn-row">
          <button type="button" class="review-submit-btn">Submit Review</button>
          <button type="button" class="review-skip-btn">Skip for now</button>
        </div>
      </div>
    \`;
    document.body.appendChild(overlay);

    let selectedRating = 5;
    const stars = overlay.querySelectorAll('.star-btn');
    stars.forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.getAttribute('data-star'));
        selectedRating = rating;
        stars.forEach(s => {
          const sRating = parseInt(s.getAttribute('data-star'));
          if (sRating <= rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      });
    });

    const textarea = overlay.querySelector('.review-textarea');
    const errDiv = overlay.querySelector('.review-error');
    const submitBtn = overlay.querySelector('.review-submit-btn');
    const skipBtn = overlay.querySelector('.review-skip-btn');

    const showResults = () => {
      overlay.remove();
      if (resultScreen) {
        resultScreen.style.display = "block";
      }
    };

    submitBtn.addEventListener('click', async () => {
      const text = textarea.value.trim();
      if (!text) {
        errDiv.textContent = 'Review text is required.';
        errDiv.style.display = 'block';
        return;
      }
      if (text.length < 10) {
        errDiv.textContent = 'Please write at least 10 characters.';
        errDiv.style.display = 'block';
        return;
      }

      errDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        let user = null;
        if (supabaseClient) {
          const { data: { session } } = await supabaseClient.auth.getSession();
          user = session?.user;
        }

        if (!user) {
          alert('You must be logged in to submit a review. The review will be skipped and you can review later.');
          showResults();
          return;
        }

        const { error } = await supabaseClient.from('reviews').insert({
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0] || 'User',
          user_email: user.email,
          rating: selectedRating,
          review_text: text,
          test_id: testId,
          is_approved: false
        });

        if (error) throw error;

        // Success - remove local storage flags since review is submitted
        localStorage.removeItem('ccat_test_completed');
        localStorage.removeItem('ccat_test_completed_id');
        alert('Thank you! Your review has been submitted for admin approval.');
        showResults();
      } catch (err) {
        console.error('Error submitting review:', err);
        errDiv.textContent = err.message || 'Failed to submit review. Please try skipping.';
        errDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
      }
    });

    skipBtn.addEventListener('click', () => {
      showResults();
    });
  };
})();
</script>
`;

  let startIdx = content.indexOf('<!-- Supabase CDN and Review Interceptor -->');
  if (startIdx !== -1) {
    const endIdx = content.lastIndexOf('</body>');
    content = content.substring(0, startIdx) + scriptToInject + '\n' + content.substring(endIdx);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated review overlay in: ${name}`);
  } else {
    // Inject before </body>
    const bodyClose = '</body>';
    if (content.includes(bodyClose)) {
      content = content.replace(bodyClose, `${scriptToInject}\n${bodyClose}`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully injected review overlay into: ${name}`);
    } else {
      console.log(`</body> not found in: ${name}`);
    }
  }
});

// Also handle the root CCATMOCK.html if it exists
const rootMock = path.join(__dirname, '..', '..', 'CCATMOCK.html');
if (fs.existsSync(rootMock)) {
  let content = fs.readFileSync(rootMock, 'utf8');

  // Insert Clear All Answers button in the header beside the timers if not present
  const timerBRegex = /<div\s+id="timerB"[^>]*>[^<]*<\/div>/i;
  const clearBtnTag = '<button id="clearAllBtn" onclick="clearAllAnswers()" style="display:none;background:var(--blue);padding:8px 15px;font-size:14px;margin-left:4px;font-weight:bold;color:white;border:none;border-radius:7px;cursor:pointer;">Clear Section Answers</button>';
  
  if (content.includes('id="clearAllBtn"')) {
    content = content.replace(/<button\s+id="clearAllBtn"[^>]*>[^<]*<\/button>/gi, clearBtnTag);
  } else if (content.match(timerBRegex)) {
    content = content.replace(timerBRegex, '$&\n        ' + clearBtnTag);
  }

  // Inject clear button visibility toggles
  if (!content.includes('clearAllBtn.style.display = "inline-block"')) {
    content = content.replace(
      /function\s+startExam\(\)\s*\{([\s\S]*?)examStarted\s*=\s*true;/gi,
      'function startExam(){\n    examStarted = true;\n    const clearBtn = document.getElementById("clearAllBtn");\n    if (clearBtn) clearBtn.style.display = "inline-block";'
    );
  }

  if (!content.includes('clearAllBtn.style.display = "none"')) {
    content = content.replace(
      /function\s+reattemptExam\(\)\s*\{/gi,
      'function reattemptExam(){\n    const clearBtn = document.getElementById("clearAllBtn");\n    if (clearBtn) clearBtn.style.display = "none";'
    );
    content = content.replace(
      /function\s+submitExam\(\)\s*\{([\s\S]*?)if\s*\(\s*examSubmitted\s*\)\s*return;\s*examSubmitted\s*=\s*true;/gi,
      'function submitExam(){\n    if(examSubmitted) return;\n    examSubmitted = true;\n    const clearBtn = document.getElementById("clearAllBtn");\n    if (clearBtn) clearBtn.style.display = "none";'
    );
  }

  const scriptToInject = `
<!-- Supabase CDN and Review Interceptor -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
(function() {
  const originalSubmitExam = window.submitExam;
  if (!originalSubmitExam) return;

  const testId = 'free-ccat-mock-test';

  window.clearAllAnswers = function() {
    const activeSec = (typeof currentSection !== 'undefined') ? currentSection : 'A';
    if (confirm("Are you sure you want to clear all Section " + activeSec + " answers?")) {
      questions.forEach(q => {
        if (q.section === activeSec) {
          localStorage.removeItem("ccat_" + testId + "_q" + q.id);
        }
      });
      if (typeof renderQuestions === 'function') renderQuestions();
      if (typeof renderNav === 'function') renderNav();
    }
  };

  const style = document.createElement('style');
  style.textContent = \`
    .review-overlay-container {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .review-card {
      background: white !important;
      border-radius: 16px !important;
      width: 100% !important;
      max-width: 440px !important;
      padding: 28px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      text-align: center !important;
      border: 1px solid #e2e8f0 !important;
      animation: reviewFadeIn 0.3s ease-out;
    }
    @keyframes reviewFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .review-icon-wrap {
      width: 64px !important;
      height: 64px !important;
      background: #f0fdf4 !important;
      color: #15803d !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 auto 16px !important;
    }
    .review-icon {
      font-size: 32px !important;
      font-weight: bold !important;
    }
    .review-title {
      font-size: 22px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0 0 8px 0 !important;
    }
    .review-subtitle {
      font-size: 14px !important;
      color: #475569 !important;
      line-height: 1.5 !important;
      margin: 0 0 20px 0 !important;
    }
    .stars-row {
      display: flex !important;
      justify-content: center !important;
      gap: 12px !important;
      margin-bottom: 20px !important;
    }
    .star-btn {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      cursor: pointer !important;
      font-size: 36px !important;
      color: #cbd5e1 !important;
      padding: 0 !important;
      margin: 0 !important;
      width: auto !important;
      height: auto !important;
      min-width: 0 !important;
      transition: transform 0.1s, color 0.1s !important;
    }
    .star-btn:hover,
    .star-btn:focus,
    .star-btn:active {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      transform: scale(1.1) !important;
      color: #cbd5e1 !important;
    }
    .star-btn.active {
      color: #eab308 !important;
    }
    .star-btn.active:hover,
    .star-btn.active:focus,
    .star-btn.active:active {
      color: #eab308 !important;
    }
    .review-textarea {
      width: 100% !important;
      height: 100px !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 12px !important;
      padding: 12px !important;
      font-size: 14px !important;
      resize: none !important;
      outline: none !important;
      margin-bottom: 12px !important;
      transition: border-color 0.2s !important;
      background: white !important;
      color: #0f172a !important;
    }
    .review-textarea:focus {
      border-color: #1769d2 !important;
    }
    .review-error {
      color: #b42318 !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      margin: -6px 0 12px !important;
      text-align: left !important;
    }
    .review-btn-row {
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
    }
    .review-submit-btn {
      background: #1769d2 !important;
      color: white !important;
      border: none !important;
      border-radius: 9999px !important;
      padding: 12px !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: opacity 0.2s !important;
      width: 100% !important;
    }
    .review-submit-btn:hover {
      background: #0d55b5 !important;
    }
    .review-skip-btn {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      color: #475569 !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      text-decoration: underline !important;
      width: 100% !important;
      text-align: center !important;
      padding: 4px !important;
    }
    .review-skip-btn:hover {
      background: transparent !important;
      color: #0f172a !important;
      text-decoration: underline !important;
    }
  \`;
  document.head.appendChild(style);

  window.submitExam = async function() {
    // Call the original exam submit logic to compute result
    originalSubmitExam();

    const resultScreen = document.getElementById("resultScreen");

    // Initialize Supabase Client
    let supabaseClient = null;
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(
        'https://uoqfnvrdbicbepjxapcf.supabase.co',
        'sb_publishable_msdaGPOf8i6-RbBzziSVpg_NWstOnT1'
      );
    }

    let user = null;
    let alreadyReviewed = false;

    if (supabaseClient) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        user = session?.user;
        if (user) {
          const { data } = await supabaseClient
            .from('reviews')
            .select('id')
            .eq('user_id', user.id)
            .eq('test_id', testId)
            .maybeSingle();
          if (data) {
            alreadyReviewed = true;
          }
        }
      } catch (err) {
        console.error('Error checking review:', err);
      }
    }

    if (alreadyReviewed || !user) {
      if (resultScreen) {
        resultScreen.style.display = "block";
      }
      localStorage.removeItem('ccat_test_completed');
      localStorage.removeItem('ccat_test_completed_id');
      return;
    }

    // Hide result screen immediately
    if (resultScreen) {
      resultScreen.style.display = "none";
    }

    const overlay = document.createElement('div');
    overlay.className = 'review-overlay-container';
    overlay.innerHTML = \`
      <div class="review-card">
        <div class="review-icon-wrap">
          <span class="review-icon">✍</span>
        </div>
        <h2 class="review-title">Submit Test Review</h2>
        <p class="review-subtitle">
          Please leave a quick review of your experience. Your feedback helps us improve the quality of our mock tests.
        </p>
        <div class="stars-row">
          <button type="button" class="star-btn active" data-star="1">★</button>
          <button type="button" class="star-btn active" data-star="2">★</button>
          <button type="button" class="star-btn active" data-star="3">★</button>
          <button type="button" class="star-btn active" data-star="4">★</button>
          <button type="button" class="star-btn active" data-star="5">★</button>
        </div>
        <textarea 
          class="review-textarea" 
          placeholder="Write your review here (minimum 10 characters)..."
        ></textarea>
        <div class="review-error" style="display:none"></div>
        <div class="review-btn-row">
          <button type="button" class="review-submit-btn">Submit Review</button>
          <button type="button" class="review-skip-btn">Skip for now</button>
        </div>
      </div>
    \`;
    document.body.appendChild(overlay);

    let selectedRating = 5;
    const stars = overlay.querySelectorAll('.star-btn');
    stars.forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.getAttribute('data-star'));
        selectedRating = rating;
        stars.forEach(s => {
          const sRating = parseInt(s.getAttribute('data-star'));
          if (sRating <= rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      });
    });

    const textarea = overlay.querySelector('.review-textarea');
    const errDiv = overlay.querySelector('.review-error');
    const submitBtn = overlay.querySelector('.review-submit-btn');
    const skipBtn = overlay.querySelector('.review-skip-btn');

    const showResults = () => {
      overlay.remove();
      if (resultScreen) {
        resultScreen.style.display = "block";
      }
    };

    submitBtn.addEventListener('click', async () => {
      const text = textarea.value.trim();
      if (!text) {
        errDiv.textContent = 'Review text is required.';
        errDiv.style.display = 'block';
        return;
      }
      if (text.length < 10) {
        errDiv.textContent = 'Please write at least 10 characters.';
        errDiv.style.display = 'block';
        return;
      }

      errDiv.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        let user = null;
        if (supabaseClient) {
          const { data: { session } } = await supabaseClient.auth.getSession();
          user = session?.user;
        }

        if (!user) {
          alert('You must be logged in to submit a review. The review will be skipped and you can review later.');
          showResults();
          return;
        }

        const { error } = await supabaseClient.from('reviews').insert({
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0] || 'User',
          user_email: user.email,
          rating: selectedRating,
          review_text: text,
          test_id: testId,
          is_approved: false
        });

        if (error) throw error;

        // Success - remove local storage flags since review is submitted
        localStorage.removeItem('ccat_test_completed');
        localStorage.removeItem('ccat_test_completed_id');
        alert('Thank you! Your review has been submitted for admin approval.');
        showResults();
      } catch (err) {
        console.error('Error submitting review:', err);
        errDiv.textContent = err.message || 'Failed to submit review. Please try skipping.';
        errDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
      }
    });

    skipBtn.addEventListener('click', () => {
      showResults();
    });
  };
})();
</script>
`;

  let startIdx = content.indexOf('<!-- Supabase CDN and Review Interceptor -->');
  if (startIdx !== -1) {
    const endIdx = content.lastIndexOf('</body>');
    content = content.substring(0, startIdx) + scriptToInject + '\n' + content.substring(endIdx);
    fs.writeFileSync(rootMock, content, 'utf8');
    console.log(`Successfully updated review overlay in root CCATMOCK.html`);
  }
}
