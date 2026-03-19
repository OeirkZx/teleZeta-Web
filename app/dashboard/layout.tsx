// [TeleZeta] Dashboard Layout
// Protected layout dengan sidebar untuk semua role dashboard
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
