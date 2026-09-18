import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { defaultRouteForRole } from "@/lib/rbac";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(defaultRouteForRole(session.user.role));
}
