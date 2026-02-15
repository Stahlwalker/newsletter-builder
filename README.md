# The Newsletter Builder

A full-stack newsletter curation and sending tool built for solo creators and small teams. Create, curate, review, and send link-based newsletters without the complexity of enterprise marketing platforms.

## 📖 What Is This?

This is a **self-hosted newsletter platform** that helps you:
- Curate interesting links into organized sections
- Use AI to write compelling snippet descriptions
- Build beautiful HTML email newsletters
- Manage subscribers with email verification
- Send newsletters via Resend (modern email API)
- Track opens, clicks, and engagement

**Perfect for:** Technical writers, developer advocates, content creators, or anyone who sends curated link newsletters.

## 🎯 Why This Exists

Most newsletter platforms (Substack, Mailchimp, ConvertKit) are designed for long-form writing or marketing automation. If you just want to share curated links with clean formatting and a simple workflow, those platforms are overkill.

This tool focuses on **link curation**: quickly add URLs, auto-generate descriptions with AI, organize by topic, review in a draft→approved workflow, and send beautiful emails.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                       │
│  - Vite + React 18                                       │
│  - Newsletter builder UI                                 │
│  - Real-time preview                                     │
│  - Markdown export                                       │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API
┌──────────────────┴──────────────────────────────────────┐
│                   Server (Express)                       │
│  - Node.js + Express                                     │
│  - Newsletter CRUD operations                            │
│  - OpenAI integration (content generation)               │
│  - Resend integration (email sending)                    │
│  - Scheduled sending (node-cron)                         │
│  - Email analytics (webhooks)                            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                PostgreSQL Database                       │
│  - Newsletters (title, intro, sections, status)          │
│  - Subscribers (email, verification, tokens)             │
│  - Analytics (opens, clicks, events)                     │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend:**
- **React 18** - UI framework
- **Vite** - Fast build tool and dev server
- **No UI framework** - Custom CSS for lightweight, fast loading

**Backend:**
- **Node.js + Express** - REST API server
- **PostgreSQL** - Relational database for newsletters and subscribers
- **OpenAI API** - Generate snippet descriptions from URLs
- **Resend API** - Modern email sending service
- **node-cron** - Scheduled newsletter sending

**Why These Choices?**
- **React**: Fast, component-based UI for newsletter builder
- **PostgreSQL**: Relational data (newsletters have sections, sections have items)
- **Resend**: Developer-friendly email API with great deliverability
- **OpenAI**: Quickly generate descriptions from URLs to speed up curation
- **Vite**: Blazing fast dev experience, instant HMR

## ✨ Features

### 📝 Newsletter Builder
- **Rich text intro editor** - Write your opening with Quill.js
- **AI-powered snippets** - Auto-generate descriptions from URLs using OpenAI
- **Custom sections** - Organize links by topic (Blogs, Tools, Jobs, etc.)
- **Live preview** - See exactly what subscribers will receive
- **Markdown export** - Export to .md for posting elsewhere

### 🔄 Workflow
- **Draft → Approve → Schedule** - Review before sending
- **Scheduled sending** - Set a date/time for automatic delivery
- **Manual override** - Send immediately when needed

### 📧 Email Management
- **Public subscribe endpoint** - Add forms to your website
- **Email verification** - Confirm new subscribers with token links
- **Secure unsubscribe** - Token-based unsubscribe in every email
- **HTML email templates** - Beautiful, responsive design

### 📊 Analytics
- **Track opens** - See who opened your newsletter
- **Track clicks** - Know which links get clicked
- **Resend webhooks** - Real-time event tracking
- **Engagement metrics** - Open rate, click rate, top links

### 🤖 Automation
- **Job board scraping** - Auto-pull relevant jobs from DevToolJobs
- **Scheduled sends** - Set it and forget it
- **Auto-generated content** - AI writes descriptions for you

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and **npm 9+**
   ```bash
   node --version  # Should be 18 or higher
   npm --version   # Should be 9 or higher
   ```

2. **PostgreSQL 14+** (local) OR **Neon account** (cloud)
   - **Local PostgreSQL**: Install from https://postgresql.org (good for development only)
   - **Neon (STRONGLY RECOMMENDED)**: Sign up at https://neon.tech
     - ⚠️ **Why Neon?** Render's free PostgreSQL **deletes all data after 90 days**
     - Neon's free tier has **no expiration** - your data is safe forever
     - 10GB storage vs Render's 1GB
     - Free forever, no credit card required

3. **Resend API key**
   - Sign up at https://resend.com (free tier: 100 emails/day)
   - Verify your domain in Resend dashboard
   - Get your API key from https://resend.com/api-keys

4. **OpenAI API key**
   - Sign up at https://platform.openai.com
   - Add credits to your account (~$5 is plenty)
   - Create API key at https://platform.openai.com/api-keys

### Installation

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd newsletter-builder
```

**2. Install dependencies**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

**3. Set up the database**

> ⚠️ **IMPORTANT**: If deploying to production, use Neon (Option A). Render's free database **permanently deletes all your data after 90 days**. Neon is free forever with no data loss.

**Option A: Using Neon (STRONGLY RECOMMENDED for production)**
- See [docs/NEON_SETUP.md](docs/NEON_SETUP.md) for full Neon setup
- **Why Neon?**
  - ✅ Free forever (no 90-day expiration like Render)
  - ✅ 10GB storage (vs Render's 1GB)
  - ✅ Your data is safe permanently
  - ✅ No credit card required
- Quick version:
  1. Create free account at https://neon.tech
  2. Create new project
  3. Copy connection string
  4. Run: `psql "<neon-connection-string>" -f server/src/schema.sql`
  5. Run migrations (see NEON_SETUP.md)

**Option B: Using local PostgreSQL (development only)**
```bash
# Create database
createdb newsletter_builder

# Apply schema
psql newsletter_builder -f server/src/schema.sql

# Apply migrations
psql newsletter_builder -f server/src/migrations/add_project_name.sql
psql newsletter_builder -f server/src/migrations/add_analytics.sql
```

**4. Configure environment variables**
```bash
# Copy example env file
cd server
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required variables in `.env`:**
```bash
# Database
DATABASE_URL=postgresql://localhost:5432/newsletter_builder
# Or if using Neon:
# DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Email (Resend)
RESEND_API_KEY=re_your_key_here
RESEND_FROM="Newsletter <hello@yourdomain.com>"

# AI (OpenAI)
OPENAI_API_KEY=sk-proj-your_key_here

# Server (optional)
PORT=5050
PUBLIC_BASE_URL=http://localhost:5050
CONFIRM_REDIRECT_URL=http://localhost:5173/confirmed
```

**5. Start the application**

Open **two terminal windows**:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```
You should see: `Server running on port 5050`

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```
You should see: `Local: http://localhost:5173`

**6. Open in browser**
```
http://localhost:5173
```

You should see the Newsletter Builder interface!

## 📁 Project Structure

```
newsletter-builder/
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── package.json
│   └── vite.config.js      # Vite configuration
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── index.js        # Express server entry
│   │   ├── schema.sql      # Database schema
│   │   ├── migrations/     # Database migrations
│   │   ├── routes/         # API endpoints
│   │   │   ├── newsletters.js
│   │   │   ├── subscribers.js
│   │   │   ├── ai.js
│   │   │   └── analytics.js
│   │   └── services/       # Business logic
│   │       ├── email.js    # Email sending (Resend)
│   │       ├── openai.js   # AI content generation
│   │       └── jobScraper.js
│   ├── .env.example        # Example environment variables
│   └── package.json
│
├── docs/                    # Documentation
│   ├── DEPLOYMENT.md       # How to deploy to Render
│   ├── NEON_SETUP.md       # Neon database setup
│   ├── SUBSCRIPTION_SETUP.md
│   ├── WEBHOOK_SETUP.md
│   └── Writing-Style.md    # AI writing style guide
│
├── .gitignore
└── README.md               # You are here
```

## 🎨 How to Use

### Creating a Newsletter

1. **Click "Create New Newsletter"**
2. **Add title and intro** - Write your opening or use AI to generate it
3. **Add links to sections**:
   - Paste URL
   - Click "Generate Description" (AI reads the page and writes a snippet)
   - Or write your own description
   - Optionally add project name
4. **Preview** - See how it looks in email format
5. **Approve** - Mark as ready to send
6. **Schedule or Send** - Pick a date/time or send immediately

### Managing Subscribers

- **Add subscribe form to your website** - See [SUBSCRIPTION_SETUP.md](docs/SUBSCRIPTION_SETUP.md)
- **Verification flow**: User subscribes → receives email → clicks link → verified
- **View all subscribers** in the UI
- **Unsubscribe links** automatically included in every email

### Scheduling Newsletters

1. Approve your newsletter
2. Click "Schedule"
3. Pick date and time
4. Server will auto-send at that time (using node-cron)

### Tracking Analytics

1. Set up Resend webhooks - See [WEBHOOK_SETUP.md](docs/WEBHOOK_SETUP.md)
2. View analytics in the newsletter detail page:
   - Open rate (%)
   - Click rate (%)
   - Which links were clicked
   - Recent events timeline

## 🔧 Customization

### Change Newsletter Sections

Edit the sections array in `client/src/App.jsx` and `server/src/routes/ai.js`:

```javascript
const defaultSections = [
  { name: 'Your Custom Section', items: [] },
  { name: 'Another Section', items: [] },
  // Add or remove as needed
];
```

### Customize Email Template

Edit `server/src/services/email.js`:
- Change colors, fonts, spacing
- Modify header/footer
- Update social links

### Customize AI Writing Style

Edit `docs/Writing-Style.md` with your style guidelines. The AI will reference this when generating content.

### Change Job Board Source

Edit `server/src/services/jobScraper.js` to scrape different job boards or remove job functionality entirely.

## 🚢 Deployment

Ready for production? Follow these guides:

1. **[Database Setup](docs/NEON_SETUP.md)** - Set up free Neon PostgreSQL database
2. **[Deploy to Render](docs/DEPLOYMENT.md)** - Deploy backend + frontend to Render
3. **[Configure Subscriptions](docs/SUBSCRIPTION_SETUP.md)** - Add subscribe forms to your website
4. **[Set Up Webhooks](docs/WEBHOOK_SETUP.md)** - Enable email analytics tracking

**Estimated Cost:**
- Neon database: **Free** (10GB, no expiration, no data loss)
- Render backend: **$7/month** (or free tier with cold starts)
- Render frontend: **Free** (static site hosting)
- Resend: **Free** (100 emails/day) or $20/month (50k emails)
- OpenAI: **~$5 one-time** (credits last months for typical usage)

**Total: ~$7-12/month** for a fully functional newsletter platform.

> 💡 **Database Choice Matters**: Using Neon (free) instead of Render's database saves you $7/month AND prevents data loss. Render's free database deletes everything after 90 days.

## 🐛 Troubleshooting

### Server won't start
- **Check PostgreSQL is running**: `pg_isready`
- **Verify .env file exists**: `ls server/.env`
- **Check port 5050 is free**: `lsof -i :5050`
- **Review server logs** for specific errors

### Database connection failed
- **Verify DATABASE_URL format**: `postgresql://user:pass@host:5432/dbname`
- **Test connection**: `psql "<DATABASE_URL>"`
- **Check schema is applied**: `psql <DATABASE_URL> -c "\dt"`

### AI generation not working
- **Verify OpenAI key is set**: Check `server/.env`
- **Check OpenAI account has credits**: https://platform.openai.com/account/billing
- **Review server logs** for API errors

### Emails not sending
- **Verify Resend key is valid**: https://resend.com/api-keys
- **Check sender email is verified**: https://resend.com/domains
- **Review Resend dashboard** for delivery status

### Client shows "API is offline"
- **Ensure server is running**: Should see "Server running on port 5050"
- **Check VITE_API_BASE**: Should match server URL
- **Verify CORS settings**: `server/src/index.js` allows your frontend origin

## 🤝 Contributing

This is a template project - fork it and make it your own!

**Ideas for improvements:**
- Add authentication for admin panel
- Support multiple users/teams
- Add more analytics (subscriber growth, engagement trends)
- A/B testing for subject lines
- Drag-and-drop section ordering
- Rich text snippet editing
- Import/export newsletters
- API for programmatic newsletter creation

## 📄 License

This project is open source and available for personal or commercial use. Modify it however you like!

## 🙏 Acknowledgments

**Built with:**
- [React](https://react.dev) - UI framework
- [Express](https://expressjs.com) - Server framework
- [PostgreSQL](https://postgresql.org) - Database
- [Resend](https://resend.com) - Email delivery
- [OpenAI](https://openai.com) - AI content generation
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Vite](https://vitejs.dev) - Build tool

## 📚 Additional Resources

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to production on Render
- **[Neon Database Setup](docs/NEON_SETUP.md)** - Free PostgreSQL hosting
- **[Subscription Setup](docs/SUBSCRIPTION_SETUP.md)** - Add subscribe forms to your site
- **[Webhook Setup](docs/WEBHOOK_SETUP.md)** - Track email analytics
- **[Writing Style Guide](docs/Writing-Style.md)** - Customize AI-generated content

---

**Questions?** Open an issue or check the docs folder for detailed guides.

**Ready to start?** Follow the Quick Start section above to get running locally in 10 minutes!
