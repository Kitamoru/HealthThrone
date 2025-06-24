import type { Metadata } from 'next';
import { Cinzel } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Your App',
  description: 'Your app description',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cinzel.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
