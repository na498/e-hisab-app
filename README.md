# 📗 ই-হিসাব (E-Hisab) - ফটোকপি ও দোকানের ক্যাশ খাতা ব্যবস্থাপনা

একটি দ্রুত, আধুনিক ও পূর্ণাঙ্গ অফলাইন ও ক্লাউড সাপেক্ষে দোকান পরিচালনা, ক্যাশ এন্ট্রি, কাস্টমার বাকি খাতা এবং অফিশিয়াল এক্সেল রিপোর্ট ডাউনলোড অ্যাপ্লিকেশন।

---

## 🚀 ভিজ্যুয়াল স্টুডিও কোডে (VS Code) রান করার নির্দেশিকা:

১. **প্রজেক্ট ডাউনলোড / ক্লোন করুন:**
   ```bash
   git clone <your-github-repo-url>
   cd react-example
   ```

২. **ডিপেন্ডেন্সি ইনস্টল করুন:**
   ```bash
   npm install
   ```

৩. **পরিবেশ রূপরেখা (.env) তৈরি করুন:**
   - প্রজেক্ট রুটে একটি `.env` ফাইল তৈরি করুন এবং নিচের মতো MongoDB Connection String বসান:
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/e_hisab?retryWrites=true&w=majority"
   PORT=3000
   ```

৪. **ডেভেলপমেন্ট সার্ভার চালু করুন:**
   ```bash
   npm run dev
   ```
   - ব্রাউজারে `http://localhost:3000` এ প্রজেক্ট চালু হবে।

---

## ☁️ Render (রেন্ডার), GitHub ও MongoDB Atlas-এ হোস্ট করার প্রক্রিয়া:

### ধাপ ১: MongoDB Atlas ডেটাবেস সেটআপ
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)-এ লগইন করে একটি **Free Shared Cluster** তৈরি করুন।
2. **Database Access**-এ গিয়ে একটি ড্যাটাবেস ইউজার নেম ও পাসওয়ার্ড তৈরি করুন।
3. **Network Access**-এ গিয়ে `0.0.0.0/0` (Allow Access from Anywhere) যুক্ত করুন।
4. **Connect > Drivers**-এ ক্লিক করে আপনার Connection String-টি কপি করুন।

### ধাপ ২: GitHub-এ কোড পুশ করুন
```bash
git init
git add .
git commit -m "E-Hisab full production app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### ধাপ ৩: Render-এ ফ্রী হোস্ট করুন
1. [Render.com](https://render.com/)-এ অ্যাকাউন্ট তৈরি করে **New Web Service** সিলেক্ট করুন।
2. আপনার GitHub এর `e-hisab` রিপোজিটোরি সিলেক্ট করুন।
3. সেটিংস দিন:
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
4. **Environment Variables** সেকশনে যুক্ত করুন:
   - Key: `MONGODB_URI`
   - Value: `আপনার MongoDB Atlas কানেকশন স্ট্রিং`
5. **Create Web Service**-এ ক্লিক করলে ২ মিনিটের মধ্যে আপনার অ্যাপ রেন্ডারে লাইভ হয়ে যাবে!

---

## 🛠️ প্রধান ফিচারসমূহ:
- **দ্রুত ক্যাশ এন্ট্রি বাটন এডিট:** অ্যাডমিন থেকে বাটন কার্ডের শিরোনাম, টাকার বাটন, ক্যাটাগরি, রং ও আইকন সরাসরি এডিট করা যায়।
- **অফিশিয়াল এক্সেল রিপোর্ট (.xls):** ছবি অনুযায়ী সম্পূর্ণ সাজানো তারিখ, আয়, ব্যয়, ক্যাশ ও স্বাক্ষর সহ রিপোর্ট ডাউনলোড।
- **সম্পূর্ণ ক্লিন স্টেট:** নমুনা তথ্য সরিয়ে ফ্রেশ ব্যবহারের ব্যবস্থা এবং এক ক্লিকে সব ডেটা মুছে পরিষ্কার (Clear All) করার সুবিধা।
