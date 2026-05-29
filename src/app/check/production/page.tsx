import { EnvChecksPage } from '@/components/check/env-checks';

export const dynamic = 'force-dynamic';

export default function ProductionCheckPage() {
  return <EnvChecksPage mode="production" />;
}
