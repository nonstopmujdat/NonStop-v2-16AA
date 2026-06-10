import './admin.css';

export default function MiniAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mini-admin-theme">
      {children}
    </div>
  );
}
