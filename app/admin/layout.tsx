import type { ReactNode } from "react";
import AdminSessionKeeper from "./AdminSessionKeeper";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminSessionKeeper />
      {children}
    </>
  );
}
