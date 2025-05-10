import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { getFullnodeUrl } from '@mysten/sui/client'
import * as path from 'path'

const NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || 'localnet'
const LEDGER_PROTO_PATH = path.join(__dirname, 'grpc/ledger_service.proto')

// Load proto definitions
const packageDefinition = protoLoader.loadSync(LEDGER_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [path.join(__dirname, 'protos')],
})

const suiProto = grpc.loadPackageDefinition(packageDefinition) as any
const LedgerService = suiProto.sui.rpc.v2beta.LedgerService

// Create gRPC client
let memoizedLedgerClient: typeof LedgerService

function getLedgerClient() {
    if (memoizedLedgerClient) {
        return memoizedLedgerClient
    }
    const client = new LedgerService(getFullnodeUrl(NETWORK), grpc.credentials.createSsl())
    memoizedLedgerClient = client
    return client
}

export function getObject(params: { id: string }) {
  return getLedgerClient().GetObject({ id: params.id }, (err, res) => {
    if (err) {
      console.error('Error:', err)
      return
    }
    res
  })
}

// TODO: add calls to gRPC Sui RPC in this file and export them for usage in the app, do not use getLedgerClient outside of this file

// example usage
// const base58Digest = '3ByWphQ5sAVojiTrTrGXGM5FmCVzpzYmhsjbhYESJtxp'
// const request = {
//   digest: base58Digest,
//   read_mask: {
//     paths: ['events', 'effects'],
//   },
// }
// client.GetTransaction(request, (err: any, response: any) => {
//   if (err) {
//     console.error('Error:', err)
//   } else {
//     console.log('Response:', JSON.stringify(response, null, 2))
//   }
// })
