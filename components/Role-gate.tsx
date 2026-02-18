"use client";

import { useRole, type Role } from "@/hooks/use-role";

type RoleGateProps = {
  allowed: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleGate({
  allowed,
  children,
  fallback = null,
}: RoleGateProps) {
  const { can } = useRole();

  if (!can(allowed)) return <>{fallback}</>;
  return <>{children}</>;
}
