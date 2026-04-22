'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Settings, AlertTriangle, Activity, Clock, Info, RefreshCw } from 'lucide-react';

export default function PortfolioStateManager() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const emergencyPauseTx = useContractTx(portfolioContract, 'emergencyPause');
  const emergencyResumeTx = useContractTx(portfolioContract, 'emergencyResume');

  const stateQuery = useContractQuery({ contract: portfolioContract, fn: 'getState' });
  const emergencyPausedQuery = useContractQuery({ contract: portfolioContract, fn: 'isEmergencyPaused' });

  const state = stateQuery.data ?? 'Unknown';
  const isEmergencyPaused = emergencyPausedQuery.data ?? false;

  const getStateStyle = (s: string) => {
    switch (s) {
      case 'Active': return { color: 'text-green-600', bg: 'bg-green-50', icon: Activity, badge: 'bg-green-500' };
      case 'Paused': return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, badge: 'bg-yellow-500' };
      case 'Maintenance': return { color: 'text-blue-600', bg: 'bg-blue-50', icon: Info, badge: 'bg-blue-500' };
      case 'Emergency': return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, badge: 'bg-red-500' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Info, badge: 'bg-gray-500' };
    }
  };

  const stateStyle = getStateStyle(state);
  const StateIcon = stateStyle.icon;

  const handleEmergencyPause = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      await emergencyPauseTx.signAndSend({
        args: ['Emergency pause triggered from dashboard'],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'emergencyPause', hash: 'success' });
              stateQuery.refresh();
              emergencyPausedQuery.refresh();
            }
          }
        },
      });
    } catch (err: any) {
      setError(`Error emergency pausing: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyResume = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      await emergencyResumeTx.signAndSend({
        args: ['Emergency resume triggered from dashboard'],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'emergencyResume', hash: 'success' });
              stateQuery.refresh();
              emergencyPausedQuery.refresh();
            }
          }
        },
      });
    } catch (err: any) {
      setError(`Error resuming: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                State Management
              </CardTitle>
              <CardDescription>Manage portfolio state and operations</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { stateQuery.refresh(); emergencyPausedQuery.refresh(); }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current State */}
          <div className="space-y-2">
            <Label>Current State</Label>
            {stateQuery.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            ) : (
              <div className={`p-4 rounded-lg ${stateStyle.bg} flex items-center gap-3`}>
                <StateIcon className={`h-5 w-5 ${stateStyle.color}`} />
                <div>
                  <div className={`font-semibold text-lg ${stateStyle.color}`}>
                    {isEmergencyPaused ? 'Emergency Pause' : state}
                  </div>
                  {isEmergencyPaused && (
                    <p className="text-sm text-red-500">Portfolio operations are halted</p>
                  )}
                </div>
                {isEmergencyPaused && (
                  <Badge variant="destructive" className="ml-auto">Emergency</Badge>
                )}
              </div>
            )}
          </div>

          {/* State Controls */}
          <div className="space-y-4">
            <h3 className="font-medium">Emergency Controls</h3>
            <p className="text-sm text-gray-600">
              Emergency pause halts all portfolio operations. Use only in critical situations.
              Requires owner permissions.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleEmergencyPause}
                disabled={isLoading || isEmergencyPaused}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Emergency Pause
              </Button>
              <Button
                onClick={handleEmergencyResume}
                disabled={isLoading || !isEmergencyPaused}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Resume Operations
              </Button>
            </div>
          </div>

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {result.type === 'emergencyPause' ? 'Portfolio emergency paused successfully.' : 'Portfolio resumed successfully.'}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2 border-t pt-4">
            <p><strong>State Management:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Active: Normal operations running</li>
              <li>Paused: Operations temporarily halted</li>
              <li>Maintenance: System under maintenance</li>
              <li>Emergency: Critical halt, requires resume</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
