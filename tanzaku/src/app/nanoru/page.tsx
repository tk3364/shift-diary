import { AuthForms, LogoutButton } from "@/components/forms";
import { currentUser } from "@/lib/auth";
import { logout } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function NanoruPage() {
  const user = await currentUser();

  if (user) {
    return (
      <main>
        <p className="empty">{user.handle} として、ここにいます。</p>
        <LogoutButton action={logout} />
      </main>
    );
  }

  return (
    <main>
      <AuthForms />
    </main>
  );
}
