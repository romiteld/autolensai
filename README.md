# AutoLensAI

🚀 **AI-Powered Automotive Marketplace Platform**

Transform your car selling experience with cutting-edge AI technology. AutoLensAI revolutionizes how dealers and private sellers showcase vehicles with automated background removal, AI-generated descriptions, and intelligent marketing campaigns.

## ✨ Features

- **🧠 AI Image Processing**: Automatic background removal and professional enhancement
- **📝 Smart Descriptions**: AI-generated vehicle descriptions optimized for sales
- **🎥 Video Generation**: Automated promotional video creation
- **📱 Marketing Automation**: Multi-platform campaign deployment
- **🔐 Authentication**: Secure user management with Supabase
- **💳 Subscription System**: Tiered pricing with Stripe integration
- **⚡ Real-time Processing**: Queue-based background jobs with Redis

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Supabase, Redis Queue System
- **AI Services**: OpenAI GPT-4, Cloudinary AI, FalAI, Sonauto
- **Payment**: Stripe subscriptions and billing
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Vercel

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/romiteld/autolensai.git
   cd autolensai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your API keys and configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🔧 Environment Setup

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FAL_API_KEY=your_fal_key
SONAUTO_API_KEY=your_sonauto_key

# Payment
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Queue System
REDIS_URL=your_redis_url
```

## 📊 Architecture

- **Service Layer Pattern**: Clean separation of business logic
- **Queue-Based Processing**: Background jobs with Bull/Redis
- **Type-Safe Development**: End-to-end TypeScript
- **Row Level Security**: Database-level access control
- **Subscription Management**: Feature gating and usage tracking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support, email support@autolensai.com or join our Discord community.

---

**Built with ❤️ for the automotive industry**
