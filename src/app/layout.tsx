import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/common/components/providers";
import { PerformanceInitializer } from "@/common/components/performance-initializer";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "AutoLensAI - AI-Powered Car Marketplace",
    template: "%s | AutoLensAI"
  },
  description: "Transform your car selling experience with AI-powered background removal, professional descriptions, and automated marketing campaigns. Sell cars 3x faster with AutoLensAI.",
  keywords: [
    "car marketplace",
    "AI automotive",
    "vehicle listings", 
    "car selling",
    "automotive AI",
    "background removal",
    "car photography",
    "automated marketing",
    "vehicle descriptions",
    "car dealership software"
  ],
  authors: [{ name: "AutoLensAI Team", url: "https://autolensai.com" }],
  creator: "AutoLensAI",
  publisher: "AutoLensAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://autolensai.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://autolensai.com",
    title: "AutoLensAI - AI-Powered Car Marketplace",
    description: "Transform your car selling experience with AI-powered tools that increase sales by 300%",
    siteName: "AutoLensAI",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AutoLensAI - AI-Powered Car Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoLensAI - AI-Powered Car Marketplace",
    description: "Transform your car selling experience with AI-powered tools",
    images: ["/twitter-image.jpg"],
    creator: "@autolensai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.autolensai.com" />
        
        {/* Critical CSS inlining hint */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "AutoLensAI",
              "description": "AI-Powered Car Marketplace Platform",
              "url": "https://autolensai.com",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free trial available"
              },
              "creator": {
                "@type": "Organization",
                "name": "AutoLensAI",
                "url": "https://autolensai.com"
              },
              "featureList": [
                "AI Background Removal",
                "Automated Descriptions", 
                "Marketing Automation",
                "3D Vehicle Showcase"
              ]
            })
          }}
        />
      </head>
      <body 
        className={`${inter.variable} font-sans antialiased bg-black text-white transform-gpu`}
        suppressHydrationWarning
      >
        <PerformanceInitializer />
        <Providers>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
        
        {/* Analytics and performance monitoring */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              if ('performance' in window && 'observe' in window.PerformanceObserver.prototype) {
                const observer = new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  entries.forEach((entry) => {
                    if (entry.entryType === 'largest-contentful-paint') {
                      console.log('LCP:', entry.startTime);
                    }
                    if (entry.entryType === 'first-input') {
                      console.log('FID:', entry.processingStart - entry.startTime);
                    }
                  });
                });
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
              }
              
              // Service worker registration
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {
                    console.log('Service worker registration failed');
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
