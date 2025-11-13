import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: "De Jongh's Panelbeating Centre ? Assistant",
  description: 'Trusted auto body repair and spray-painting assistant.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
