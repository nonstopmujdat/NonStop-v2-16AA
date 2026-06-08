import './globals.css';

export const metadata = {
  title: 'NONSTOP V1.9',
  description: 'NONSTOP Basketbol ve Lig Yönetimi MVP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
