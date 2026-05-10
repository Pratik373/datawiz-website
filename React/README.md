# Datawiz6 Landing Page

A modern, responsive landing page for the Datawiz6 Data Science & Statistics channel built with React and Supabase.

## Features

✨ **Modern Design** - Beautiful gradient UI with smooth animations
📧 **Email Collection** - User emails saved to Supabase database
🔗 **Social Integration** - Links to YouTube, LinkedIn, and Email
📱 **Responsive** - Mobile-first design that works on all devices
⚡ **Fast & Lightweight** - Built with React for optimal performance

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
The `.env` file is already configured with your Supabase credentials:
```
REACT_APP_SUPABASE_URL=https://uoqfnvrdbicbepjxapcf.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_msdaGPOf8i6-RbBzziSVpg_NWstOnT1
```

### 3. Supabase Setup

**Create an `emails` table in your Supabase database:**

1. Go to your Supabase dashboard
2. Create a new table named `emails`
3. Add columns:
   - `id` (UUID, Primary Key)
   - `email` (Text, Unique)
   - `created_at` (Timestamp)

**Or run this SQL:**
```sql
CREATE TABLE emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Run Development Server
```bash
npm start
```

Visit `http://localhost:3000` in your browser.

## Build for Production
```bash
npm run build
```

## Project Structure

```
React/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main component
│   ├── App.css         # Styling
│   ├── index.js        # Entry point
│   ├── index.css       # Global styles
│   └── supabaseClient.js
├── .env                # Supabase credentials
├── package.json
└── README.md
```

## Customization

### Update Social Links
Edit social links in `src/App.js`:
```jsx
href="https://www.youtube.com/@Datawiz6"
href="https://www.linkedin.com/in/datawiz6/"
href="mailto:allaboutstatistics19@gmail.com"
```

### Add Banner Image
Replace the placeholder banner image URL in `src/App.js`:
```jsx
src="https://your-image-url.jpg"
```

### Customize Colors
Edit the color scheme in `src/App.css`:
- Primary: `#667eea`
- Secondary: `#764ba2`
- Accent: `#ff6b6b`

## Technologies Used

- **React 18** - UI Framework
- **Supabase** - Backend & Database
- **CSS3** - Styling & Animations

## License

Datawiz6 © 2024

## Support

For issues or questions, contact: allaboutstatistics19@gmail.com
