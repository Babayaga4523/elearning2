import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { NewAdminLayout } from "@/components/admin/new-admin-layout";

export const metadata: Metadata = {
  title: "Admin Console | BNI Finance",
  icons: {
    icon: "/admin-favicon.svg",
  },
};

const AdminLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const session = await auth();

  console.log("[ADMIN_LAYOUT] Session check:", {
    hasSession: !!session,
    email: session?.user?.email,
    activeRole: session?.user?.activeRole,
    roles: session?.user?.roles,
  });

  // Check if user is authenticated
  if (!session?.user) {
    console.log("[ADMIN_LAYOUT] No session, redirecting to login");
    return redirect("/auth/login");
  }

  // Check if user has admin role (using new multi-role system)
  const activeRole = session.user.activeRole;
  const roles = session.user.roles || [];
  
  // User must have ADMIN or SUPER_ADMIN in their roles
  const hasAdminRole = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
  
  console.log("[ADMIN_LAYOUT] Authorization check:", {
    hasAdminRole,
    activeRole,
    roles,
  });
  
  if (!hasAdminRole) {
    // User doesn't have admin role at all
    console.log("[ADMIN_LAYOUT] User does not have admin role, redirecting to dashboard");
    return redirect("/dashboard");
  }

  // User has admin role, but must have selected it as activeRole
  if (activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN") {
    // Redirect to login with check-role to force role selection
    console.log("[ADMIN_LAYOUT] User has admin role but not selected as active, redirecting to role selection");
    return redirect("/auth/login?check-role=true");
  }

  console.log("[ADMIN_LAYOUT] Access granted");

  return ( 
    <NewAdminLayout 
      userName={session.user.name ?? "Admin"} 
      userEmail={session.user.email ?? ""}
    >
      {children}
    </NewAdminLayout>
   );
}

export default AdminLayout;
