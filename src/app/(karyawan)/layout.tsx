import { Navbar } from "@/components/karyawan/navbar";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { KaryawanLayoutClient } from "@/components/karyawan/layout-client";

export default async function KaryawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // Fetch user data for navbar
  let user = null;
  if (session?.user?.id) {
    user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        department: true,
        image: true,
      }
    });
  }

  return (
    <KaryawanLayoutClient user={user || undefined}>
      {children}
    </KaryawanLayoutClient>
  );
}
