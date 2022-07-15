import { BigInt } from "@graphprotocol/graph-ts";

import {
  CandlePrice,
  ChainlinkPrice,
} from "../generated/schema";

let MATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
let WETH = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"
let BTC = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6"
let LINK = "0xb0897686c545045afc77cf20ec7a532e3120e0f1"
let UNI = "0xb33eaad8d922b1083446dc23f610c2567fb5180f"
let AAVE = "0xd6df932a45c0f255f85145f286ea0b292b21c90b"
let DAI = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"
let USDT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
let USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"

import { AnswerUpdated as AnswerUpdatedEvent } from "../generated/ChainlinkAggregatorBTC/ChainlinkAggregator";

function _storeChainlinkPrice(
  token: string,
  value: BigInt,
  timestamp: BigInt
): void {
  _storeCandlePrice(token, value, "5m", timestamp);
  _storeCandlePrice(token, value, "15m", timestamp);
  _storeCandlePrice(token, value, "1h", timestamp);
  _storeCandlePrice(token, value, "4h", timestamp);
  _storeCandlePrice(token, value, "1d", timestamp);

  let totalEntity = new ChainlinkPrice(token);
  totalEntity.value = value;
  totalEntity.period = "last";
  totalEntity.token = token;
  totalEntity.timestamp = timestamp.toI32();
  totalEntity.save();
}

function _storeCandlePrice(
  token: string,
  value: BigInt,
  period: string,
  timestamp: BigInt
): void {
  
  let periodSeconds = "";
  if (period === "5m") {
    periodSeconds = "300";
  } else if (period === "15m") {
    periodSeconds = "900";
  } else if (period === "1h") {
    periodSeconds = "3600";
  } else if (period === "4h") {
    periodSeconds = "14400";
  } else if (period === "1d") {
    periodSeconds = "86400";
  }

  let timestampMod = timestamp.minus(
    timestamp.mod(BigInt.fromString(periodSeconds))
  ); // 5min
  let id = token + ":" + period + ":" + timestampMod.toString();
  let prevId = token + ":" + period + ":" + timestampMod.minus(BigInt.fromString(periodSeconds)).toString();

  let entity = CandlePrice.load(id);
  if (entity == null) {
    entity = new CandlePrice(id);
    entity.token = token;
    entity.period = period;
    entity.o = value;
    entity.h = value;
    entity.l = value;

    let prevEntity = CandlePrice.load(prevId);
    if(prevEntity){
      prevEntity.c = value;
      prevEntity.h = value.gt(prevEntity.h) ? value : prevEntity.h;
      prevEntity.l = value.lt(prevEntity.l) ? value : prevEntity.l;
      prevEntity.save()
    }

  } else {
    entity.h = value.gt(entity.h) ? value : entity.h;
    entity.l = value.lt(entity.l) ? value : entity.l;
  }

  entity.c = value;
  entity.period = period;
  entity.timestamp = timestampMod.toI32();
  entity.save();
}

export function handleAnswerUpdatedBTC(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(BTC, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedETH(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(WETH, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedMATIC(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(MATIC, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedLINK(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(LINK, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedUNI(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(UNI, event.params.current, event.block.timestamp);
}

export function handleAnswerUpdatedAAVE(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(AAVE, event.params.current, event.block.timestamp);
}
