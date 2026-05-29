import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

const ASSET_HUB_PASEO_ACCOUNT_URL = 'https://assethub-paseo.subscan.io/account';

export function getAssetHubPaseoAccountUrl(account: string | null | undefined): string | undefined {
  const value = account?.trim();

  if (!value) {
    return undefined;
  }

  return `${ASSET_HUB_PASEO_ACCOUNT_URL}/${encodeURIComponent(value)}`;
}

export function SubscanAccountLink({
  children,
  href,
}: {
  children: ReactNode;
  href?: string;
}) {
  if (!href) {
    return <>{children}</>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
    >
      {children}
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}
