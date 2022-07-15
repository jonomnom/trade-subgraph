import {
  BigInt,
  Address
} from "@graphprotocol/graph-ts"
import {
  CreateIncreaseOrder,
  CreateDecreaseOrder,
  CreateSwapOrder,
  CancelIncreaseOrder,
  CancelDecreaseOrder,
  CancelSwapOrder,
  ExecuteIncreaseOrder,
  ExecuteDecreaseOrder,
  ExecuteSwapOrder
} from "../generated/OrderBook/OrderBook"

import {
  Order,
  OrderStat
} from "../generated/schema"

import {
  getTokenAmountUsd
} from "./helpers"
import { _storeActions } from "./tradingMapping"

function _getId(account: Address, type: string, index: BigInt): string {
  let id = account.toHexString() + "-" + type + "-" + index.toString()
  return id
}

function _storeStats(incrementProp: string, decrementProp: string | null): void {
  let entity = OrderStat.load("total")
  if (entity == null) {
    entity = new OrderStat("total")
    entity.openSwap = 0 as i32
    entity.openIncrease = 0 as i32
    entity.openDecrease = 0 as i32
    entity.cancelledSwap = 0 as i32
    entity.cancelledIncrease = 0 as i32
    entity.cancelledDecrease = 0 as i32
    entity.executedSwap = 0 as i32
    entity.executedIncrease = 0 as i32
    entity.executedDecrease = 0 as i32
    entity.period = "total"
  }

  entity.setI32(incrementProp, entity.getI32(incrementProp) + 1)
  if (decrementProp != null) {
    entity.setI32(decrementProp, entity.getI32(decrementProp) - 1)
  }

  entity.save()
}

function _handleCreateOrder(
  account: Address,
  type: string,
  index: BigInt,
  size: BigInt,
  timestamp: BigInt,
  triggerPrice: BigInt,
  triggerAboveThreshold: boolean,
  indexToken: Address = null,
  isLong: boolean = false,
  collateralToken: Address = null,
  collateral: BigInt = null
): void {
  let id = _getId(account, type, index)
  let order = new Order(id)

  order.account = account.toHexString()
  order.createdTimestamp = timestamp.toI32()
  order.index = index
  order.type = type
  order.status = "open"
  order.size = size
  order.triggerPrice = triggerPrice
  order.triggerAboveThreshold = triggerAboveThreshold
  if (indexToken !== null) order.indexToken = indexToken.toHexString()
  order.isLong = isLong
  if (collateralToken !== null) order.collateralToken = collateralToken.toHexString()
  if (collateral !== null) order.collateral = collateral

  order.save()
}

function _handleCancelOrder(account: Address, type: string, index: BigInt, timestamp: BigInt): void {
  let id = account.toHexString() + "-" + type + "-" + index.toString()
  let order = Order.load(id)

  order.status = "cancelled"
  order.cancelledTimestamp = timestamp.toI32()

  order.save()
}

function _handleExecuteOrder(account: Address, type: string, index: BigInt, timestamp: BigInt): void {
  let id = account.toHexString() + "-" + type + "-" + index.toString()
  let order = Order.load(id)

  order.status = "executed"
  order.executedTimestamp = timestamp.toI32()

  order.save()
}

export function handleCreateIncreaseOrder(event: CreateIncreaseOrder): void {
  _handleCreateOrder(
    event.params.account,
    "increase",
    event.params.orderIndex,
    event.params.sizeDelta,
    event.block.timestamp,
    event.params.triggerPrice,
    event.params.triggerAboveThreshold,
    event.params.indexToken,
    event.params.isLong
  );
  _storeStats("openIncrease", null)

  let paramsString = '{'+
  '"account": "'+event.params.account.toHexString()+'"'+ 
  ',"indexToken":"' +event.params.indexToken.toHexString()+'"'+
  ',"sizeDelta":"' +event.params.sizeDelta.toString()+'"'+
  ',"collateralToken":"' +event.params.collateralToken.toHexString()+'"'+
  ',"orderIndex":"' +event.params.orderIndex.toString()+'"'
  paramsString = paramsString +
  ',"purchaseToken":"' +event.params.purchaseToken.toHexString()+'"'+
  ',"executionFee":"' +event.params.executionFee.toString()+'"'+
  ',"isLong":"' +(event.params.isLong?'true':'false')+'"'+
  ',"triggerPrice":"' +event.params.triggerPrice.toString()+'"'+
  ',"triggerAboveThreshold":"' +(event.params.triggerAboveThreshold?'true':'false')+'"'+
  '}'

  _storeActions(event, event.params.account.toHexString(), event.params.isLong? "CreateIncreaseOrder-Long": "CreateIncreaseOrder-Short", paramsString);
}

export function handleCancelIncreaseOrder(event: CancelIncreaseOrder): void {
  _handleCancelOrder(event.params.account, "increase", event.params.orderIndex, event.block.timestamp);
  _storeStats("cancelledIncrease", "openIncrease")
}

export function handleExecuteIncreaseOrder(event: ExecuteIncreaseOrder): void {
  _handleExecuteOrder(event.params.account, "increase", event.params.orderIndex, event.block.timestamp);
  _storeStats("executedIncrease", "openIncrease")


  let paramsString = '{'+
  '"account": "'+event.params.account.toHexString()+'"'+ 
  ',"indexToken":"' +event.params.indexToken.toHexString()+'"'+
  ',"sizeDelta":"' +event.params.sizeDelta.toString()+'"'+
  ',"collateralToken":"' +event.params.collateralToken.toHexString()+'"'+
  ',"orderIndex":"' +event.params.orderIndex.toString()+'"'
  paramsString = paramsString +
  ',"purchaseToken":"' +event.params.purchaseToken.toHexString()+'"'+
  ',"executionFee":"' +event.params.executionFee.toString()+'"'+
  ',"executionPrice":"' +event.params.executionPrice.toString()+'"'+
  ',"triggerPrice":"' +event.params.triggerPrice.toString()+'"'+
  ',"triggerAboveThreshold":"' +(event.params.triggerAboveThreshold?'true':'false')+'"'+
  '}'

  _storeActions(event, event.params.account.toHexString(), event.params.isLong? "ExecuteIncreaseOrder-Long": "ExecuteIncreaseOrder-Short", paramsString);
}

export function handleCreateDecreaseOrder(event: CreateDecreaseOrder): void {
  _handleCreateOrder(
    event.params.account,
    "decrease",
    event.params.orderIndex,
    event.params.sizeDelta,
    event.block.timestamp,
    event.params.triggerPrice,
    event.params.triggerAboveThreshold,
    event.params.indexToken,
    event.params.isLong,
    event.params.collateralToken,
    event.params.collateralDelta
  );
  _storeStats("openDecrease", null)

  let paramsString = '{'+
  '"account": "'+event.params.account.toHexString()+'"'+ 
  ',"indexToken":"' +event.params.indexToken.toHexString()+'"'+
  ',"sizeDelta":"' +event.params.sizeDelta.toString()+'"'+
  ',"collateralToken":"' +event.params.collateralToken.toHexString()+'"'+
  ',"orderIndex":"' +event.params.orderIndex.toString()+'"'
  paramsString = paramsString +
  ',"executionFee":"' +event.params.executionFee.toString()+'"'+
  ',"isLong":"' +(event.params.isLong?'true':'false')+'"'+
  ',"triggerPrice":"' +event.params.triggerPrice.toString()+'"'+
  ',"triggerAboveThreshold":"' +(event.params.triggerAboveThreshold?'true':'false')+'"'+
  '}'
  _storeActions(event, event.params.account.toHexString(), event.params.isLong? "CreateDecreaseOrder-Long": "CreateDecreaseOrder-Short", paramsString);
}

export function handleCancelDecreaseOrder(event: CancelDecreaseOrder): void {
  _handleCancelOrder(event.params.account, "decrease", event.params.orderIndex, event.block.timestamp);
  _storeStats("cancelledDecrease", "openDecrease")
}

export function handleExecuteDecreaseOrder(event: ExecuteDecreaseOrder): void {
  _handleExecuteOrder(event.params.account, "decrease", event.params.orderIndex, event.block.timestamp);
  _storeStats("executedDecrease", "openDecrease")
  let paramsString = '{'+
  '"account": "'+event.params.account.toHexString()+'"'+ 
  ',"indexToken":"' +event.params.indexToken.toHexString()+'"'+
  ',"sizeDelta":"' +event.params.sizeDelta.toString()+'"'+
  ',"collateralToken":"' +event.params.collateralToken.toHexString()+'"'+
  ',"orderIndex":"' +event.params.orderIndex.toString()+'"'
  paramsString = paramsString +
  ',"executionFee":"' +event.params.executionFee.toString()+'"'+
  ',"executionPrice":"' +event.params.executionPrice.toString()+'"'+
  ',"triggerPrice":"' +event.params.triggerPrice.toString()+'"'+
  ',"isLong":"' +(event.params.isLong?'true':'false')+'"'+
  ',"triggerAboveThreshold":"' +(event.params.triggerAboveThreshold?'true':'false')+'"'+
  '}'
  _storeActions(event, event.params.account.toHexString(), event.params.isLong? "ExecuteDecreaseOrder-Long": "ExecuteDecreaseOrder-Short", paramsString);
}

export function handleCreateSwapOrder(event: CreateSwapOrder): void {
  let path = event.params.path
  let size = getTokenAmountUsd(path[0].toHexString(), event.params.amountIn)
  _handleCreateOrder(
    event.params.account,
    "swap",
    event.params.orderIndex,
    size,
    event.block.timestamp,
    event.params.triggerRatio,
    event.params.triggerAboveThreshold
  );
  _storeStats("openSwap", null)


  let paramsString = '{'+
  '"account": "'+event.params.account.toHexString()+'"'+ 
  ',"path":"' +event.params.path.toString()+'"'+
  ',"orderIndex":"' +event.params.orderIndex.toString()+'"'+
  ',"shouldUnwrap":"' +(event.params.shouldUnwrap?'true':'false')+'"'
  paramsString = paramsString +
  ',"executionFee":"' +event.params.executionFee.toString()+'"'+
  ',"amountIn":"' +event.params.amountIn.toString()+'"'+
  ',"minOut":"' +event.params.minOut.toString()+'"'+
  ',"triggerRatio":"' +event.params.triggerRatio.toString()+'"'+
  ',"triggerAboveThreshold":"' +(event.params.triggerAboveThreshold?'true':'false')+'"'+
  '}'
  _storeActions(event, event.params.account.toHexString(), "CreateSwapOrder", paramsString);
}

export function handleCancelSwapOrder(event: CancelSwapOrder): void {
  _handleCancelOrder(event.params.account, "swap", event.params.orderIndex, event.block.timestamp);
  _storeStats("cancelledSwap", "openSwap")
}

export function handleExecuteSwapOrder(event: ExecuteSwapOrder): void {
  _handleExecuteOrder(event.params.account, "swap", event.params.orderIndex, event.block.timestamp);
  _storeStats("executedSwap", "openSwap")


  let paramsString = '{'+
  '"account": "'+event.params.account.toHexString()+'"'+ 
  ',"path":"' +event.params.path.toString()+'"'+
  ',"orderIndex":"' +event.params.orderIndex.toString()+'"'+
  ',"shouldUnwrap":"' +(event.params.shouldUnwrap?'true':'false')+'"';
  paramsString = paramsString +
  ',"executionFee":"' +event.params.executionFee.toString()+'"'+
  ',"amountIn":"' +event.params.amountIn.toString()+'"'+
  ',"amountOut":"' +event.params.amountOut.toString()+'"'+
  ',"minOut":"' +event.params.minOut.toString()+'"';
  paramsString = paramsString +
  ',"triggerRatio":"' +event.params.triggerRatio.toString()+'"'+
  ',"triggerAboveThreshold":"' +(event.params.triggerAboveThreshold?'true':'false')+'"'+
  '}';

    _storeActions(event, event.params.account.toHexString(), "ExecuteSwapOrder", paramsString);
}
