import { Client, Wallet } from 'xrpl'

const TESTNET = 'wss://s.altnet.rippletest.net:51233'

async function main() {
  const client = new Client(TESTNET)
  await client.connect()

  console.log('Generating wallet and funding from testnet faucet...')
  const { wallet } = await client.fundWallet()

  console.log('\n✅ Wallet ready\n')
  console.log(`Address : ${wallet.address}`)
  console.log(`Seed    : ${wallet.seed}`)
  console.log('\nAdd this to your .env.local:')
  console.log(`XRP_WALLET_SEED=${wallet.seed}`)
  console.log(`XRP_TESTNET_WSS=${TESTNET}`)

  await client.disconnect()
}

main().catch(console.error)
