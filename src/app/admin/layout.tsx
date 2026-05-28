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
  children,
}: {
  children: React.ReactNode;
}) => {
  const session = await auth();

  if (!session?.user) {
    return redirect("/auth/login");
  }

  const activeRole = session.user.activeRole;
  const roles = session.user.roles || [];
  const hasAdminRole = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");

  if (!hasAdminRole) {
    return redirect("/dashboard");
  }

  if (activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN") {
    return redirect("/auth/login?check-role=true");
  }

  return (
    <NewAdminLayout
      userName={session.user.name ?? "Admin"}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </NewAdminLayout>
  );
};

export default AdminLayout;