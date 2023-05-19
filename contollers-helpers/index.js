const holdingtimearray = [
  "5 Min",
  "15 Min",
  "30 Min",
  "1 Hour",
  "2 Hour",
  "3 Hour",
  "4 Hour",
  "5 Hour",
  "6 Hour",
  "> 6 Hour",
];

const holdingtimeRange = [
  {
    case: {
      $and: [{ $gt: ["$holdingperiod", 0] }, { $lte: ["$holdingperiod", 5] }],
    },
    then: "5 Min",
  },
  {
    case: {
      $and: [{ $gt: ["$holdingperiod", 5] }, { $lte: ["$holdingperiod", 15] }],
    },

    then: "15 Min",
  },
  {
    case: {
      $and: [{ $gt: ["$holdingperiod", 15] }, { $lte: ["$holdingperiod", 30] }],
    },
    then: "30 Min",
  },
  {
    case: {
      $and: [{ $gt: ["$holdingperiod", 30] }, { $lte: ["$holdingperiod", 60] }],
    },
    then: "1 Hour",
  },
  {
    case: {
      $and: [
        { $gt: ["$holdingperiod", 60] },
        { $lte: ["$holdingperiod", 120] },
      ],
    },
    then: "2 Hour",
  },
  {
    case: {
      $and: [
        { $gt: ["$holdingperiod", 120] },
        { $lte: ["$holdingperiod", 180] },
      ],
    },
    then: "3 Hour",
  },
  {
    case: {
      $and: [
        { $gt: ["$holdingperiod", 180] },
        { $lte: ["$holdingperiod", 240] },
      ],
    },

    then: "4 Hour",
  },
  {
    case: {
      $and: [
        { $gt: ["$holdingperiod", 240] },
        { $lte: ["$holdingperiod", 300] },
      ],
    },
    then: "5 Hour",
  },
  {
    case: {
      $and: [
        { $gt: ["$holdingperiod", 300] },
        { $lte: ["$holdingperiod", 360] },
      ],
    },
    then: "6 Hour",
  },
  {
    case: {
      $gt: ["$holdingperiod", 360],
    },

    then: "> 6 Hour",
  },
];

const tradesforreport = {
  $push: {
    _id: "$_id",
    symbol: "$symbol",
    profit: "$profit",
    quantity: "$quantity",
    action: "$action",
    rmultiple: "$rmultiple",
    returnpercent: "$returnpercent",
    entrydate: "$entrydate",
    rrrplanned: "$rrrplanned",
    netpnl: "$netpnl",
  },
};

const ThesortOrderIndexOne = {
  $sort: {
    sortOrderIndex: 1,
  },
};

const TheMostTradedSymbol = {
  $addFields: {
    mostTradedSymbol: {
      $let: {
        vars: {
          sortedCounts: { $objectToArray: "$symbolCounts" },
        },
        in: {
          $arrayElemAt: [
            "$$sortedCounts.k",
            {
              $indexOfArray: ["$$sortedCounts.v", { $max: "$$sortedCounts.v" }],
            },
          ],
        },
      },
    },
  },
};

const TheSymbolCounts = {
  $addFields: {
    symbolCounts: {
      $reduce: {
        input: "$symbol",
        initialValue: {},
        in: {
          $mergeObjects: [
            "$$value",
            { $arrayToObject: [[{ k: "$$this", v: 1 }]] },
          ],
        },
      },
    },
  },
};

const FirstBestTrade = {
  $first: {
    symbol: "$symbol",
    profit: "$profit",
    returnpercent: "$returnpercent",
  },
};

const LastWorstTrade = {
  $last: {
    symbol: "$symbol",
    profit: "$profit",
    returnpercent: "$returnpercent",
  },
};

const TradesWithSymbolProfitQty = {
  $push: {
    _id: "$_id",
    symbol: "$symbol",
    profit: "$profit",
    quantity: "$quantity",
  },
};

module.exports = {
  holdingtimeRange,
  holdingtimearray,
  tradesforreport,
  ThesortOrderIndexOne,
  TheMostTradedSymbol,
  TheSymbolCounts,
  FirstBestTrade,
  LastWorstTrade,
  TradesWithSymbolProfitQty,
};
