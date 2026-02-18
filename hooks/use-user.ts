import { useSession } from "@/lib/auth-client";
import type { Role } from "@/hooks/use-role";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: Role;
};

export function useUser() {
  const { data: session, isPending } = useSession();
  const user = session?.user as unknown as SessionUser | undefined;

  return {
    user,
    isPending,
    id: user?.id,
    name: user?.name,
    email: user?.email,
    image: user?.image,
    role: user?.role,
  };
}
