# DeepWiki Setup Guide (Roman Urdu)

## Important: Is Project Me Database Setup Ki Zarurat NAHI Hai! 🎉

**Yeh project me koi traditional database (MySQL, PostgreSQL, MongoDB) setup nahi karna hai.**

Yeh project **automatic file-based storage** use karta hai jo aapke machine pe locally store hota hai.

---

## 📁 Storage Location (Automatic)

Data automatically is location pe store hota hai:

**Windows:**
```
C:\Users\<YourUsername>\.adalflow\
```

**Linux/Mac:**
```
~/.adalflow/
```

**Storage Structure:**
```
.adalflow/
├── repos/           # Cloned repositories
├── databases/       # Embeddings (.pkl files)
└── wikicache/       # Generated wiki cache
```

---

## ✅ Setup Steps

### Step 1: API Keys Configure Karein

**File:** `.env` (project root me create karein)

```env
# Required - At least ek API key chahiye
GOOGLE_API_KEY=your_google_api_key
# OR
OPENAI_API_KEY=your_openai_api_key

# Optional - Embeddings ke liye (recommended: google)
DEEPWIKI_EMBEDDER_TYPE=google

# Optional - OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional - Ollama (local models)
OLLAMA_HOST=http://localhost:11434

# Optional - Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_VERSION=your_azure_openai_version
```

**API Keys Kaise Mile:**
- Google API Key: [Google AI Studio](https://makersuite.google.com/app/apikey)
- OpenAI API Key: [OpenAI Platform](https://platform.openai.com/api-keys)

---

### Step 2: Backend Start Karein

```bash
# Dependencies install karein
cd api
python -m pip install poetry==1.8.2
poetry install

# Server start karein
python -m api.main
```

Server start hoga: `http://localhost:8001`

---

### Step 3: Frontend Start Karein

```bash
# Dependencies install karein
npm install

# Frontend start karein
npm run dev
```

Frontend start hoga: `http://localhost:3000`

---

## 🔧 Database Cache Issue Fix

Agar **"No valid embeddings found"** error aaye:

### Option 1: Database Cache Delete Karein (Recommended)

**Windows PowerShell:**
```powershell
# Database folder delete karein
Remove-Item -Recurse -Force "$env:USERPROFILE\.adalflow\databases"
```

**Linux/Mac:**
```bash
# Database folder delete karein
rm -rf ~/.adalflow/databases
```

### Option 2: Specific Repository Database Delete

**File name:** `{owner}_{repo}.pkl`

**Example:** `dev4you2k16_tita.pkl`

**Windows:**
```powershell
Remove-Item "$env:USERPROFILE\.adalflow\databases\dev4you2k16_tita.pkl"
```

**Linux/Mac:**
```bash
rm ~/.adalflow/databases/dev4you2k16_tita.pkl
```

**Database delete karne ke baad:**
1. Wiki generate dobara try karein
2. Embeddings fresh create hongi
3. Issue resolve ho jayega

---

## 📝 Quick Checklist

- [ ] `.env` file create ki hai
- [ ] At least ek API key add ki hai (GOOGLE_API_KEY ya OPENAI_API_KEY)
- [ ] Backend server start ho raha hai (port 8001)
- [ ] Frontend start ho raha hai (port 3000)
- [ ] Agar embeddings error aaye, database cache delete kar di hai

---

## 🚨 Common Issues

### Issue: "No valid embeddings found"
**Solution:** Database cache delete karein (see above)

### Issue: API key missing
**Solution:** `.env` file me API key add karein

### Issue: Backend server nahi start ho raha
**Solution:** 
1. Check karein ke dependencies install hain
2. Check karein ke port 8001 free hai
3. Error logs check karein

### Issue: Frontend backend se connect nahi ho raha
**Solution:**
1. Backend server running hai confirm karein
2. `SERVER_BASE_URL` environment variable check karein

---

## 💡 Important Notes

1. **Database Setup NAHI Chahiye** - Yeh automatic file storage use karta hai
2. **Storage Automatic** - Data automatically `~/.adalflow/` me store hota hai
3. **API Keys Required** - At least ek API key configure karni hogi
4. **Database Cache Delete** - Agar embeddings issue ho to database cache delete karein

---

## 🎯 Next Steps

1. API keys configure karein
2. Backend aur frontend start karein
3. Browser me `http://localhost:3000` open karein
4. Repository URL enter karein
5. Wiki generate karein!

**Agar koi issue ho to database cache delete karke dobara try karein!**

