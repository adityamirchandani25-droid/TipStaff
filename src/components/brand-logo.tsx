import Image from "next/image";

export function BrandLogo() {
  return <span className="ts-logo" role="img" aria-label="FixItFast">
    <Image className="ts-logo-light" src="/images/fixitfast-logo-light.png" alt="" width={2167} height={725} priority />
    <Image className="ts-logo-dark" src="/images/fixitfast-logo-dark.png" alt="" width={2168} height={725} priority />
  </span>;
}
