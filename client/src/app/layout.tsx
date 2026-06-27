import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncParty — Listen Together, Anywhere",
  description: "Join a shared music room and listen to YouTube music together in perfect synchronization. Real-time sync, chat, and collaborative playlists.",
  keywords: "music, sync, party, youtube, listen together, shared music, real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {/* Animated background */}
        <div className="bg-animated">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
        </div>
        <div className="bg-grid" />
        
        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
