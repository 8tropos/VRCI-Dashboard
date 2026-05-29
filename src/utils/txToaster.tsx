// src/utils/txToaster.tsx

import { useMemo } from 'react';
import { toast, TypeOptions } from 'react-toastify';
import { ISubmittableResult, TxStatus } from 'dedot/types';
import { useTypink } from 'typink';

export type TxToaster = {
    onTxProgress: (result: ISubmittableResult) => void;
    onTxError: (e: Error) => void;
    onTxPending: () => void;
    onTxTimeout: () => void;
};

export function txToaster(
    initialMessage: string = 'Signing Transaction...',
    timeoutMs: number = 30000 // 30 seconds default timeout
): TxToaster {
    const toastId = toast.info(initialMessage, {
        autoClose: false,
        isLoading: true,
        closeOnClick: false,
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
        toast.update(toastId, {
            render: 'Transaction timeout - please check your wallet and network connection',
            type: 'warning',
            isLoading: false,
            autoClose: 8000,
            closeOnClick: true,
        });
    }, timeoutMs);

    const onTxPending = () => {
        toast.update(toastId, {
            render: 'Transaction pending in mempool...',
            type: 'info',
            isLoading: true,
            autoClose: false,
            closeOnClick: false,
        });
    };

    const onTxProgress = (result: ISubmittableResult) => {
        let toastType: TypeOptions = 'default';
        let autoClose: boolean | number = false;
        let toastMessage: string = 'Transaction In Progress...';

        const { status, dispatchError } = result;
        const succeeded = !dispatchError;

        // Clear timeout on any progress
        clearTimeout(timeoutId);

        if (status.type === 'Finalized') {
            autoClose = 5_000;
            toastType = succeeded ? 'success' : 'error';
            toastMessage = succeeded ? 'Transaction Successful!' : 'Transaction Failed';
        } else if (status.type === 'BestChainBlockIncluded') {
            toastType = succeeded ? 'success' : 'error';
            toastMessage = succeeded ? 'Transaction Confirmed' : 'Transaction Failed';
            autoClose = 5_000;
        } else if (status.type === 'Invalid' || status.type === 'Drop') {
            autoClose = 5_000;
            toastType = 'error';
            toastMessage = 'Transaction Failed';
        } else if (status.type === 'Validated') {
            toastMessage = 'Transaction ready to submit...';
        } else if (status.type === 'Broadcasting') {
            toastMessage = 'Transaction broadcast to network...';
        }

        toast.update(toastId, {
            render: <TxProgress message={toastMessage} status={status} dispatchError={dispatchError} />,
            type: toastType,
            isLoading: !autoClose,
            autoClose,
            closeOnClick: !!autoClose,
        });
    };

    const onTxError = (e: Error) => {
        clearTimeout(timeoutId);
        toast.update(toastId, {
            render: <p>Transaction Error: {e.message}</p>,
            type: 'error',
            isLoading: false,
            autoClose: 8000,
            closeOnClick: true,
        });
    };

    const onTxTimeout = () => {
        clearTimeout(timeoutId);
        toast.update(toastId, {
            render: 'Transaction timed out - please try again',
            type: 'warning',
            isLoading: false,
            autoClose: 8000,
            closeOnClick: true,
        });
    };

    return {
        onTxProgress,
        onTxError,
        onTxPending,
        onTxTimeout,
    };
}

const getBlockInfo = (status: TxStatus) => {
    if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
        return `(#${status.value.blockNumber} / ${status.value.txIndex})`;
    }

    if ((status.type === 'Invalid' || status.type === 'Drop') && status.value.error) {
        return `(${status.value.error})`;
    }

    return '';
};

const stringifyTxError = (value: unknown): string => {
    try {
        return JSON.stringify(
            value,
            (_key, nestedValue) => typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue,
            2
        ) ?? String(value);
    } catch {
        return String(value);
    }
};

const getDispatchErrorDetails = (dispatchError: unknown): string | null => {
    if (!dispatchError) {
        return null;
    }

    if (typeof dispatchError === 'object' && dispatchError !== null && 'type' in dispatchError) {
        const error = dispatchError as { type?: string; value?: unknown };

        if (error.type === 'Module') {
            return `Runtime module error: ${stringifyTxError(error.value)}`;
        }

        return `${error.type ?? 'DispatchError'}: ${stringifyTxError(error.value ?? dispatchError)}`;
    }

    return stringifyTxError(dispatchError);
};

interface TxProgressProps {
    message: string;
    status: TxStatus;
    dispatchError?: unknown;
}

function TxProgress({ message, status, dispatchError }: TxProgressProps) {
    const { network } = useTypink();
    const dispatchErrorDetails = getDispatchErrorDetails(dispatchError);

    const { label: viewOnExplorer, url: explorerUrl } = useMemo(() => {
        if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
            const { subscanUrl, pjsUrl } = network;

            if (subscanUrl) {
                return {
                    label: 'View transaction on Subscan',
                    url: `${subscanUrl}/extrinsic/${status.value.blockNumber}-${status.value.txIndex}`,
                };
            }

            if (pjsUrl) {
                return {
                    label: 'View transaction on Polkadot.js',
                    url: `${pjsUrl}#/explorer/query/${status.value.blockHash}`,
                };
            }
        }

        return { label: null, url: '' };
    }, [status]);

    return (
        <div>
            <p>{message}</p>
            <p style={{ fontSize: 12 }}>
                {status.type} {getBlockInfo(status)}
            </p>
            {dispatchErrorDetails ? (
                <pre style={{ fontSize: 11, marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                    {dispatchErrorDetails}
                </pre>
            ) : null}

            {viewOnExplorer && (
                <p style={{ fontSize: 12, marginTop: '0.5rem' }}>
                    <a style={{ textDecoration: 'underline' }} href={explorerUrl} target='_blank'>
                        👉 {viewOnExplorer}
                    </a>
                </p>
            )}
        </div>
    );
}
