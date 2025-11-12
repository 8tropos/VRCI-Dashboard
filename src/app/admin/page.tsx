'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TokenForm } from '@/components/admin/token-form';
import { TokenList } from '@/components/admin/token-list';
import { TokenTable } from '@/components/admin/token-table';
import { Settings, Plus, List, Table2 } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>('table');

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>
            Manage tokens and monitor Oracle data from CoinMarketCap
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Table View
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Token Management
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Token
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-6">
          <TokenTable />
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <TokenList />
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <TokenForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

