'use client';

import { useState } from 'react';
import { useCreateToken } from '@/hooks/api/useTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2 } from 'lucide-react';

export function TokenForm() {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createToken = useCreateToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!symbol.trim() || !name.trim()) {
      setError('Symbol and name are required');
      return;
    }

    try {
      await createToken.mutateAsync({
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        enabled: true,
      });

      // Reset form
      setSymbol('');
      setName('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Token
        </CardTitle>
        <CardDescription>Add a new token/coin to track in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol *</Label>
            <Input
              id="symbol"
              placeholder="BTC, ETH, DOT..."
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              maxLength={10}
              required
              disabled={createToken.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Bitcoin, Ethereum, Polkadot..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createToken.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Token description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createToken.isPending}
            />
          </div>

          <Button type="submit" disabled={createToken.isPending} className="w-full">
            {createToken.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Token
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

