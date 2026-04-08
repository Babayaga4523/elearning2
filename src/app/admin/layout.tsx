import { Sidebar } from "@/components/admin/sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
    <div className="h-full">
      <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="md:pl-64 pt-20 h-full">
        <div className="flex h-20 items-center px-10 border-b fixed inset-y-0 w-full bg-white z-[40]">
           <h2 className="text-xl font-semibold text-slate-700">Administrator Console</h2>
           <div className="ml-auto flex items-center space-x-4">
             <span className="text-sm font-medium text-slate-500">{session.user.name}</span>
             <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
               {session.user.name?.charAt(0)}
             </div>
           </div>
        </div>
        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
   );
}
 
export default AdminLayout;
