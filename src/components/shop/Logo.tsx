import logo from "@/assets/dealguru-logo.png.asset.json";
import mark from "@/assets/dealguru-mark.png.asset.json";
import { Link } from "@tanstack/react-router";

export const LOGO_URL = logo.url;

/** The cart icon from the DealGuru logo on its own (admin sidebar, small spots). */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return <img src={mark.url} alt="" width={650} height={472} className={`${className} shrink-0 object-contain`} />;
}

/** Full DealGuru logo (cart + name). */
export function Logo({ onClick, className = "h-8 sm:h-9" }: { onClick?: () => void; className?: string }) {
  return (
    <Link to="/" onClick={onClick} className="flex min-w-0 items-center" aria-label="DealGuru home">
      <img src={logo.url} alt="DealGuru" width={1002} height={190} className={`${className} w-auto max-w-full object-contain`} />
    </Link>
  );
}

/** The three motion bars from the logo, used as a light decoration. */
export function SpeedLines({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} fill="currentColor" aria-hidden>
      <rect x="0" y="4" width="120" height="16" rx="8" />
      <rect x="22" y="32" width="98" height="16" rx="8" />
      <rect x="48" y="60" width="72" height="16" rx="8" />
    </svg>
  );
}
