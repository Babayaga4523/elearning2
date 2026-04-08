import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    if (session.user?.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  // If not logged in, the middleware will already handle redirection to /auth/login
  // since "/" is no longer a public route. But we can explicitly redirect here too.
  redirect("/auth/login");
}
