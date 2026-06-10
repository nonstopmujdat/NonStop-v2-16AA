import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'NONSTOP V2.1',
  description: 'NONSTOP Basketbol ve Lig Yönetimi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="nn-app-layout">
          <Sidebar />
          <div className="nn-main-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
