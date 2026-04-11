import { auth } from "@/auth";
import { redirect } from 'next/navigation';
import { Navbar } from "@/components/ui/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      {children}
    </div>
  );
}
