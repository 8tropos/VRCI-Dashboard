import { EnvChecksPage } from '@/components/check/env-checks';

export const dynamic = 'force-dynamic';

export default function DevelopmentCheckPage() {
  return <EnvChecksPage mode="development" />;
}
