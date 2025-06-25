import { FunctionsHttpError } from '@supabase/supabase-js'

const DEFAULT_USER_MESSAGE = 'Something went wrong, try again or ask help in Wizards and Duels telegram'

/**
 * a class to wrap errors to have a common interface to display to the user and handle errors int the app
 */
export class AppError {
  public message: string
  private originalErr: Error | null
  private ctx: string;

  constructor(ctx: string, err: unknown) {
    if (err instanceof Error) {
      this.message = err.message
      this.originalErr = err
    } else {
      this.message = 'Unknown error'
      this.originalErr = null
    }
    this.ctx = ctx
  }

  log() {
    if (this.originalErr) {
      console.debug(`[${this.ctx}] | ${this.originalErr}`)
    }
  }

  async deriveUserMessage(): Promise<string> {
    if (this.originalErr instanceof FunctionsHttpError) {
      if (this.originalErr.context.headers.get('content-type') === 'application/json') {
        try {
          const body = await this.originalErr.context.json()
          return body?.result?.message || DEFAULT_USER_MESSAGE
        } catch {
          return DEFAULT_USER_MESSAGE
        }
      }
    }
    return DEFAULT_USER_MESSAGE
  }
}

// Error response not enough gas, POST 200 OK
// {
//     "jsonrpc": "2.0",
//     "id": 1121,
//     "error": {
//         "code": -32002,
//         "message": "Transaction validator signing failed due to issues with transaction inputs, please review the errors and try again:\n- Balance of gas object 2943736 is lower than the needed amount: 3040136"
//     }
// }

// Error response object with given id not available
// {
//     "jsonrpc": "2.0",
//     "id": 600,
//     "error": {
//         "code": -32002,
//         "message": "Transaction validator signing failed due to issues with transaction inputs, please review the errors and try again:\n- Object ID 0x83fdf74aafb830490ac66258cf1a763d914cc775896c22de200f1b97e745daa4 Version 0x192ad1b5 Digest HefdTartVdYJpLT9x56PqyYiUweAMaYiRDEvzT8xfk1D is not available for consumption, current version: 0x192ad1b6"
//     }
// }

// object not found
// {
//     "jsonrpc": "2.0",
//     "id": 267,
//     "result": {
//         "error": {
//             "code": "notExists",
//             "object_id": "0xbd2995682239452f216ec517fbac6ff47cffaace23c53caa9f5539228b73d573"
//         }
//     }
// }

// Network error 502 Bad Gateway during RPC call

// when zkLogin token expired
// Error: Missing required parameters for proof generation
//     at INTERNAL_ONLY_EnokiFlow.getProof (@mysten_enoki.js?v=919df6c6:1535:13)
//     at async INTERNAL_ONLY_EnokiFlow.getKeypair (@mysten_enoki.js?v=919df6c6:1559:5)
//     at async Object.signTransaction (@mysten_enoki.js?v=919df6c6:1663:23)
//     at async Object.mutationFn (@mysten_dapp-kit.js?v=919df6c6:13161:36)
