import Image from "next/image";
import Link from "next/link";

export default function GalleryAdminNav() {
  return (
    <nav className="galleryAdminNav" aria-label="Gallery administration">
      <Link className="galleryAdminBrand" href="/admin">
        <Image src="/vault-logo-light.png" alt="Vault" width={132} height={38} priority />
        <span>Studio Admin</span>
      </Link>
      <div>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/galleries">Galleries</Link>
        <Link className="galleryAdminNavPrimary" href="/admin/galleries/new">New gallery</Link>
      </div>
    </nav>
  );
}
