import { Wallet, type Payment } from 'xrpl'
import { createHash } from 'crypto'

const TESTNET_HTTP = 'https://s.altnet.rippletest.net:51234'
export const XRP_EXPLORER = 'https://testnet.xrpl.org/transactions'

// Compte genesis XRPL — toujours actif sur testnet, utilisé comme destination de log
const LOG_DESTINATION = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'

function toHex(str: string) {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase()
}

async function rpc(method: string, params: object) {
  const res = await fetch(TESTNET_HTTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params: [params] }),
  })
  return res.json()
}

type RestaurantPayload = {
  name: string
  city: string
  country: string
  michelin_stars: number
  green_stars?: boolean | null
}

export async function logRestaurantOnChain(restaurant: RestaurantPayload): Promise<string> {
  const wallet = Wallet.fromSeed(process.env.XRP_WALLET_SEED!)

  const [accountInfo, ledgerInfo] = await Promise.all([
    rpc('account_info', { account: wallet.address, ledger_index: 'current' }),
    rpc('ledger_current', {}),
  ])

  if (accountInfo.result.error) {
    throw new Error(`Compte XRP introuvable: ${accountInfo.result.error_message}`)
  }

  const memo = {
    type: 'michelin_restaurant',
    name: restaurant.name,
    city: restaurant.city,
    stars: restaurant.michelin_stars,
    green: restaurant.green_stars ?? false,
    hash: createHash('sha256')
      .update(`${restaurant.name}:${restaurant.michelin_stars}:${restaurant.city}`)
      .digest('hex'),
    ts: Date.now(),
  }

  const tx: Payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: LOG_DESTINATION,
    Amount: '1',
    Fee: '12',
    Sequence: accountInfo.result.account_data.Sequence,
    LastLedgerSequence: ledgerInfo.result.ledger_current_index + 20,
    Memos: [{
      Memo: {
        MemoType: toHex('michelin/restaurant'),
        MemoData: toHex(JSON.stringify(memo)),
      },
    }],
  }

  const signed = wallet.sign(tx)
  const { result } = await rpc('submit', { tx_blob: signed.tx_blob })

  if (result.engine_result !== 'tesSUCCESS' && result.engine_result !== 'terQUEUED') {
    throw new Error(`Soumission XRP échouée: ${result.engine_result} — ${result.engine_result_message}`)
  }

  return signed.hash
}
