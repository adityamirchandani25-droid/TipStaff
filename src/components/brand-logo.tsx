import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";
import { Wrench } from "lucide-react";

/** Save the supplied, unmodified logo at public/images/tipstaff-logo.png. */
export function BrandLogo() {
  const available = existsSync(path.join(process.cwd(), "public/images/tipstaff-logo.png"));
  if (!available) return <span className="ts-logo"><Wrench size={25} aria-hidden="true" />TipStaff</span>;
  return <span className="ts-brand-image"><Image src="/images/tipstaff-logo.png" alt="TipStaff" width={2056} height={765} priority unoptimized /></span>;
}
