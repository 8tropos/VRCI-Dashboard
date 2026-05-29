import Link from 'next/link';
import { Code2, Rocket, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckIndexPage() {
  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Checks</h1>
        <p className="text-muted-foreground">
          Pick the environment mode you want to validate.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/check/development" className="block">
          <Card className="h-full transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Development Checks
              </CardTitle>
              <CardDescription>
                Validates `_DEV` values first, then base fallbacks.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use this for `npm run dev`, local RPCs, and local or test deployments.
            </CardContent>
          </Card>
        </Link>

        <Link href="/check/production" className="block">
          <Card className="h-full transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Production Checks
              </CardTitle>
              <CardDescription>
                Validates base env values and ignores `_DEV` values.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use this before build/deploy because production reads only base contract and RPC vars.
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Resolution Rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Development uses values like `NEXT_PUBLIC_TOKEN_ADDRESS_DEV`, then falls back to `NEXT_PUBLIC_TOKEN_ADDRESS`.
          </p>
          <p>
            Production uses values like `NEXT_PUBLIC_TOKEN_ADDRESS` only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
