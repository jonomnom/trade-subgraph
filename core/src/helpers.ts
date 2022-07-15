import { BigInt, TypedMap } from "@graphprotocol/graph-ts"
import {
  ChainlinkPrice,
  UniswapPrice
} from "../generated/schema"

export let BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)
export let PRECISION = BigInt.fromI32(10).pow(30)

export let MVX = "0x2760e46d9bb43dafcbecaad1f64b93207f9f0ed7"

export let MATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
export let WETH = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"
export let BTC = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6"
export let LINK = "0xb0897686c545045afc77cf20ec7a532e3120e0f1"
export let UNI = "0xb33eaad8d922b1083446dc23f610c2567fb5180f"
export let AAVE = "0xd6df932a45c0f255f85145f286ea0b292b21c90b"
export let DAI = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"
export let USDT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
export let USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"


export function timestampToDay(timestamp: BigInt): BigInt {
  return timestampToPeriod(timestamp, "daily")
}

export function timestampToPeriod(timestamp: BigInt, period: string): BigInt {
  let periodTime: BigInt

  if (period == "daily") {
    periodTime = BigInt.fromI32(86400)
  } else if (period == "hourly") {
    periodTime = BigInt.fromI32(3600)
  } else if (period == "weekly" ){
    periodTime = BigInt.fromI32(86400 * 7)
  } else {
    throw new Error("Unsupported period " + period)
  }

  return timestamp / periodTime * periodTime
}

export function getTokenDecimals(token: String): u8 {
  let tokenDecimals = new Map<String, i32>()
  tokenDecimals.set(MATIC, 18)
  tokenDecimals.set(WETH, 18)
  tokenDecimals.set(BTC, 8)
  tokenDecimals.set(LINK, 18)
  tokenDecimals.set(UNI, 18)
  tokenDecimals.set(AAVE, 18)
  tokenDecimals.set(USDC, 6)
  tokenDecimals.set(USDT, 6)
  tokenDecimals.set(DAI, 18)

  tokenDecimals.set(MVX, 18)

  return tokenDecimals.get(token) as u8
}

export function getTokenAmountUsd(token: String, amount: BigInt): BigInt {
  let decimals = getTokenDecimals(token)
  let denominator = BigInt.fromI32(10).pow(decimals)
  let price = getTokenPrice(token)
  return amount * price / denominator
}

export function getTokenPrice(token: String): BigInt {
  if (token != MVX) {
    let chainlinkPriceEntity = ChainlinkPrice.load(token)
    if (chainlinkPriceEntity != null) {
      // all chainlink prices have 8 decimals
      // adjusting them to fit MVX 30 decimals USD values
      return chainlinkPriceEntity.value * BigInt.fromI32(10).pow(22)
    }
  }

  if (token == MVX) {
    let uniswapPriceEntity = UniswapPrice.load(MVX)

    if (uniswapPriceEntity != null) {
      return uniswapPriceEntity.value
    }
  }

  let prices = new TypedMap<String, BigInt>()
  prices.set(MATIC, BigInt.fromI32(1) * PRECISION)
  prices.set(WETH, BigInt.fromI32(1800) * PRECISION)
  prices.set(BTC, BigInt.fromI32(30000) * PRECISION)
  prices.set(LINK, BigInt.fromI32(8) * PRECISION)
  prices.set(UNI, BigInt.fromI32(5) * PRECISION)
  prices.set(AAVE, BigInt.fromI32(100) * PRECISION)
  
  prices.set(USDC, PRECISION)
  prices.set(USDT, PRECISION)
  prices.set(DAI, PRECISION)

  prices.set(MVX, PRECISION)

  return prices.get(token) as BigInt
}
