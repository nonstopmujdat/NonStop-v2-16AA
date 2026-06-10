import './globals.css';
import BackButton from '@/components/BackButton';

export const metadata = {
  title: 'NONSTOP V2.1',
  description: 'NONSTOP Basketbol ve Lig Yönetimi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="nn-app-layout">
          <BackButton />
          <div className="nn-main-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
