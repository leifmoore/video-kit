import './globals.css';

export const metadata = {
  title: 'Video Kit',
  description: 'A minimal, high-speed UI for generating video via Kie.ai',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
