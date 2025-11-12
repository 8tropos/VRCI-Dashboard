/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Contract method information
 */
export interface ContractMethod {
  label: string;
  selector: string;
  mutates: boolean;
  payable: boolean;
  args: Array<{
    label: string;
    type: {
      type: number;
      displayName?: string[];
    };
  }>;
  returnType?: {
    type: number;
    displayName?: string[];
  };
  docs?: string[];
}

/**
 * Contract metadata
 */
export interface ContractMetadata {
  name: string;
  version: string;
  messages: ContractMethod[];
  constructors: Array<{
    label: string;
    selector: string;
    args: Array<{
      label: string;
      type: {
        type: number;
        displayName?: string[];
      };
    }>;
    docs?: string[];
  }>;
}

/**
 * Contract call request
 */
export interface ContractCallRequest {
  method: string;
  args?: unknown[];
  address?: string;
}

/**
 * Contract transaction request
 */
export interface ContractTxRequest {
  method: string;
  args?: unknown[];
  signer?: string;
  value?: string;
}

