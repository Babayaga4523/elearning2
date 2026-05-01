import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    // Fetch user's roles and active role from database (source of truth)
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { roles: true, activeRole: true },
    });

    if (user) {
      // If user has active role, redirect based on that role
      if (user.activeRole) {
        if (user.activeRole === "ADMIN" || user.activeRole === "SUPER_ADMIN") {
          redirect("/admin");
        } else {
          redirect("/dashboard");
        }
      } else if (user.roles && user.roles.length > 0) {
        // User has roles but no active role set, redirect to role selection
        redirect("/auth/login?check-role=true");
      } else {
        // User has no roles, this shouldn't happen but redirect to login
        redirect("/auth/login");
      }
    }
  }

  // If not logged in, redirect to login
  redirect("/auth/login");
}
