import { Sidebar } from "@/components/admin/sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminNavbar } from "@/components/admin/admin-navbar";

const AdminLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return redirect("/");
  }

  return ( 
    <div className="h-full bg-[#F0F2F7]">
      <div className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50 transition-all duration-500">
        <Sidebar />
      </div>
      <main className="md:pl-72 h-full min-h-screen flex flex-col transition-all duration-500">
        <AdminNavbar 
          userName={session.user.name ?? "Admin"} 
          userEmail={session.user.email ?? ""} 
        />
        {/* Padding horizontal simetris agar jarak kiri–kanan area konten sama */}
        <div className="flex-1 animate-in fade-in duration-700 px-4 pb-4 pt-4 md:px-6 md:pb-8 md:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
   );
}
 
export default AdminLayout;
