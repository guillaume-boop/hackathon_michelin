import { Client, Wallet } from 'xrpl'
import { createHash } from 'crypto'

const TESTNET_WSS = process.env.XRP_TESTNET_WSS ?? 'wss://s.altnet.rippletest.net:51233'
export const XRP_EXPLORER = 'https://testnet.xrpl.org/transactions'

function toHex(str: string) {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase()
}

type RestaurantPayload = {
  name: string
  city: string
  country: string
  michelin_stars: number
  green_stars?: boolean | null
}

export async function logRestaurantOnChain(restaurant: RestaurantPayload): Promise<string> {
  const client = new Client(TESTNET_WSS)
  await client.connect()

  try {
    const wallet = Wallet.fromSeed(process.env.XRP_WALLET_SEED!)

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

    const tx = await client.autofill({
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: wallet.address,
      Amount: '1',
      Memos: [{
        Memo: {
          MemoType: toHex('michelin/restaurant'),
          MemoData: toHex(JSON.stringify(memo)),
        },
      }],
    })

    const signed = wallet.sign(tx)
    const result = await client.submitAndWait(signed.tx_blob)
    return result.result.hash
  } finally {
    await client.disconnect()
  }
}
