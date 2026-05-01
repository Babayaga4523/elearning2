import { getLockedTargets } from "./actions";
import { LockedAccountsClient } from "./client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Akun Terkunci | Admin BNI Finance E-Learning",
};

export default async function LockedAccountsPage() {
  const { lockedEmails, lockedIps } = await getLockedTargets();

  return (
    <LockedAccountsClient 
      lockedEmails={lockedEmails} 
      lockedIps={lockedIps} 
    />
  );
}
