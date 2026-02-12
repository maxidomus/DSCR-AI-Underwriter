
import { AssetType, LoanPurpose, LoanRequest, PricingBreakdown } from "../types";

const TRANSACTION_ADJUSTMENTS: Record<string, Record<string, Record<string, number | "N/O">>> = {
  "Purchase": {
    "780+": { LTV_50: 1, LTV_55: 1, LTV_60: 0.75, LTV_65: 0.75, LTV_70: 0.25, LTV_75: 0, LTV_80: -0.75 },
    "760-779": { LTV_50: 0.75, LTV_55: 0.75, LTV_60: 0.5, LTV_65: 0.25, LTV_70: 0, LTV_75: -0.5, LTV_80: -1.25 },
    "740-759": { LTV_50: 0.75, LTV_55: 0.75, LTV_60: 0.25, LTV_65: 0, LTV_70: -0.25, LTV_75: -1, LTV_80: -1.75 },
    "720-739": { LTV_50: 0.5, LTV_55: 0.5, LTV_60: 0, LTV_65: -0.25, LTV_70: -0.75, LTV_75: -1.5, LTV_80: -2.5 },
    "700-719": { LTV_50: 0.25, LTV_55: 0.25, LTV_60: -0.25, LTV_65: -0.75, LTV_70: -1.25, LTV_75: -2.25, LTV_80: -3.25 },
    "680-699": { LTV_50: 0, LTV_55: 0, LTV_60: -0.5, LTV_65: -1.25, LTV_70: -1.75, LTV_75: -2.75, LTV_80: "N/O" },
    "660-679": { LTV_50: -0.25, LTV_55: -0.25, LTV_60: -1, LTV_65: -1.75, LTV_70: -2.5, LTV_75: "N/O", LTV_80: "N/O" }
  },
  "Rate & Term": {
    "780+": { LTV_50: 1, LTV_55: 1, LTV_60: 0.75, LTV_65: 0.75, LTV_70: 0.25, LTV_75: 0, LTV_80: -0.75 },
    "760-779": { LTV_50: 0.75, LTV_55: 0.75, LTV_60: 0.5, LTV_65: 0.25, LTV_70: 0, LTV_75: -0.5, LTV_80: -1.25 },
    "740-759": { LTV_50: 0.75, LTV_55: 0.75, LTV_60: 0.25, LTV_65: 0, LTV_70: -0.25, LTV_75: -1, LTV_80: -1.82 },
    "720-739": { LTV_50: 0.5, LTV_55: 0.5, LTV_60: 0, LTV_65: -0.25, LTV_70: -0.75, LTV_75: -1.5, LTV_80: -2.61 },
    "700-719": { LTV_50: 0.25, LTV_55: 0.25, LTV_60: -0.25, LTV_65: -0.75, LTV_70: -1.25, LTV_75: -2.25, LTV_80: -3.41 },
    "680-699": { LTV_50: 0, LTV_55: 0, LTV_60: -0.5, LTV_65: -1.25, LTV_70: -1.75, LTV_75: -2.75, LTV_80: "N/O" },
    "660-679": { LTV_50: -0.25, LTV_55: -0.25, LTV_60: -1, LTV_65: -1.75, LTV_70: -2.5, LTV_75: "N/O", LTV_80: "N/O" }
  },
  "Cash Out": {
    "780+": { LTV_50: 0.75, LTV_55: 0.75, LTV_60: 0.5, LTV_65: 0.25, LTV_70: -0.5, LTV_75: -1.5, LTV_80: "N/O" },
    "760-779": { LTV_50: 0.5, LTV_55: 0.5, LTV_60: 0.25, LTV_65: -0.25, LTV_70: -0.75, LTV_75: -2, LTV_80: "N/O" },
    "740-759": { LTV_50: 0.5, LTV_55: 0.5, LTV_60: 0, LTV_65: -0.5, LTV_70: -1, LTV_75: -2.5, LTV_80: "N/O" },
    "720-739": { LTV_50: 0.25, LTV_55: 0.25, LTV_60: -0.25, LTV_65: -0.75, LTV_70: -1.5, LTV_75: -3, LTV_80: "N/O" },
    "700-719": { LTV_50: 0, LTV_55: 0, LTV_60: -0.5, LTV_65: -1.25, LTV_70: -2, LTV_75: -3.75, LTV_80: "N/O" },
    "680-699": { LTV_50: -0.25, LTV_55: -0.25, LTV_60: -0.75, LTV_65: -1.75, LTV_70: -2.5, LTV_75: "N/O", LTV_80: "N/O" }
  }
};

const OTHER_ADJUSTMENTS: Record<string, Record<string, Record<string, number | "N/O">>> = {
  "Property_Type": {
    "Single Family / Condo / Townhome": { LTV_50: 0, LTV_55: 0, LTV_60: 0, LTV_65: 0, LTV_70: 0, LTV_75: 0, LTV_80: 0 },
    "2 - 4 Unit": { LTV_50: -0.5, LTV_55: -0.5, LTV_60: -0.75, LTV_65: -1, LTV_70: -1.25, LTV_75: -1.5, LTV_80: -2 },
    "Short Term Rental": { LTV_50: 0, LTV_55: 0, LTV_60: 0, LTV_65: 0, LTV_70: 0, LTV_75: 0, LTV_80: 0 },
    "Multi Family (up to 9)": { LTV_50: -4.5, LTV_55: -4.5, LTV_60: -5, LTV_65: -5.5, LTV_70: -6, LTV_75: -6.5, LTV_80: "N/O" }
  },
  "Loan_Amount": {
    "<=$150,000": { LTV_50: -1, LTV_55: -1, LTV_60: -1, LTV_65: -1, LTV_70: -1, LTV_75: -1, LTV_80: -1 },
    "<=$1,000,000": { LTV_50: -0.5, LTV_55: -0.5, LTV_60: -0.5, LTV_65: -0.5, LTV_70: -0.5, LTV_75: -0.5, LTV_80: -0.5 },
    "<=$1,500,000": { LTV_50: -0.5, LTV_55: -0.5, LTV_60: -0.5, LTV_65: -0.5, LTV_70: -0.5, LTV_75: -0.5, LTV_80: -0.5 },
    "<=$2,000,000": { LTV_50: -1.5, LTV_55: -1.5, LTV_60: -1.5, LTV_65: -1.5, LTV_70: -1.5, LTV_75: -1.5, LTV_80: -1.5 },
    "<=$2,500,000": { LTV_50: -1.5, LTV_55: -1.5, LTV_60: -1.5, LTV_65: -1.5, LTV_70: -1.5, LTV_75: -1.5, LTV_80: -1.5 },
    "<=$3,000,000": { LTV_50: "N/O", LTV_55: "N/O", LTV_60: "N/O", LTV_65: "N/O", LTV_70: "N/O", LTV_75: "N/O", LTV_80: "N/O" }
  },
  "DSCR": {
    "< 1.15": { LTV_50: 0, LTV_55: 0, LTV_60: -0.25, LTV_65: -0.25, LTV_70: -0.25, LTV_75: -0.5, LTV_80: -0.75 },
    "> 1.15 <= 1.30": { LTV_50: 0, LTV_55: 0, LTV_60: 0, LTV_65: 0, LTV_70: 0, LTV_75: 0, LTV_80: 0 },
    "> 1.30": { LTV_50: 0.25, LTV_55: 0.25, LTV_60: 0.25, LTV_65: 0.25, LTV_70: 0.25, LTV_75: 0.25, LTV_80: 0.25 }
  },
  "Prepayment_Penalty": {
    "No Penalty": { LTV_50: -2, LTV_55: -2, LTV_60: -2, LTV_65: -2, LTV_70: -2, LTV_75: -2, LTV_80: -2 },
    "12 Months": { LTV_50: -1.5, LTV_55: -1.5, LTV_60: -1.5, LTV_65: -1.5, LTV_70: -1.5, LTV_75: -1.5, LTV_80: -1.5 },
    "24 Months": { LTV_50: 0, LTV_55: 0, LTV_60: 0, LTV_65: 0, LTV_70: 0, LTV_75: 0, LTV_80: 0 },
    "36 Months": { LTV_50: 1, LTV_55: 1, LTV_60: 1, LTV_65: 1, LTV_70: 1, LTV_75: 1, LTV_80: 1 },
    "48 Months": { LTV_50: 1, LTV_55: 1, LTV_60: 1, LTV_65: 1, LTV_70: 1, LTV_75: 1, LTV_80: 1 },
    "60 Months": { LTV_50: 1.5, LTV_55: 1.5, LTV_60: 1.5, LTV_65: 1.5, LTV_70: 1.5, LTV_75: 1.5, LTV_80: 1.5 }
  }
};

const RATE_TABLE = [
  { rate: 8.625, price: 107.9915 },
  { rate: 8.5, price: 107.7398 },
  { rate: 8.375, price: 107.4709 },
  { rate: 8.25, price: 107.194 },
  { rate: 8.125, price: 106.9092 },
  { rate: 8.0, price: 106.595 },
  { rate: 7.875, price: 106.2769 },
  { rate: 7.75, price: 105.9293 },
  { rate: 7.625, price: 105.5737 },
  { rate: 7.5, price: 105.2072 },
  { rate: 7.375, price: 104.8213 },
  { rate: 7.25, price: 104.4051 },
  { rate: 7.125, price: 103.9478 },
  { rate: 7.0, price: 103.4705 },
  { rate: 6.875, price: 102.9475 },
  { rate: 6.75, price: 102.3999 },
  { rate: 6.625, price: 101.8146 },
  { rate: 6.5, price: 101.1988 },
  { rate: 6.375, price: 100.5527 },
  { rate: 6.25, price: 99.8761 },
  { rate: 6.125, price: 99.1588 },
  { rate: 6.0, price: 98.4211 }
];

export const calculateQuotedRate = (request: LoanRequest, ltv: number, dscr: number): PricingBreakdown => {
  const txType = request.loanPurpose === LoanPurpose.PURCHASE ? "Purchase" : (request.isCashOut ? "Cash Out" : "Rate & Term");
  
  // Special check for Foreign National with no US Credit
  if (request.isForeignNational && (request.ficoScore === 0 || !request.ficoScore)) {
    return {
      transactionType: txType,
      ltvLabel: `LTV_${Math.round(ltv * 100)}`,
      ficoRange: "No US Credit",
      propertyTypeLabel: request.assetType,
      loanTier: "N/A",
      dscrRange: "N/A",
      prepayLabel: request.prepaymentPenalty,
      adj1: 0, adj2: 0, adj3: 0, adj4: 0, adj5: 0,
      totalAdj: 0, initialPrice: 0, closestMatchPrice: 0, initialRate: 0,
      shiftedPrice: 0, finalMatchPrice: 0, finalRate: "Pending Review",
      isOffered: true,
      requiresManualRateReview: true
    };
  }

  const fico = request.ficoScore;
  let ficoRange = "";
  if (fico >= 780) ficoRange = "780+";
  else if (fico >= 760) ficoRange = "760-779";
  else if (fico >= 740) ficoRange = "740-759";
  else if (fico >= 720) ficoRange = "720-739";
  else if (fico >= 700) ficoRange = "700-719";
  else if (fico >= 680) ficoRange = "680-699";
  else ficoRange = "660-679";

  const ltvPct = ltv * 100;
  let ltvLabel = "";
  if (ltvPct <= 50) ltvLabel = "LTV_50";
  else if (ltvPct <= 55) ltvLabel = "LTV_55";
  else if (ltvPct <= 60) ltvLabel = "LTV_60";
  else if (ltvPct <= 65) ltvLabel = "LTV_65";
  else if (ltvPct <= 70) ltvLabel = "LTV_70";
  else if (ltvPct <= 75) ltvLabel = "LTV_75";
  else ltvLabel = "LTV_80";

  const adj1 = TRANSACTION_ADJUSTMENTS[txType][ficoRange][ltvLabel];

  let propTypeLabel = "";
  if (request.isShortTermRental) propTypeLabel = "Short Term Rental";
  else if (request.assetType === AssetType.SINGLE) propTypeLabel = "Single Family / Condo / Townhome";
  else propTypeLabel = "2 - 4 Unit";
  
  const adj2 = OTHER_ADJUSTMENTS["Property_Type"][propTypeLabel][ltvLabel];

  const loanAmt = request.asIsValue * ltv;
  let loanTier = "";
  if (loanAmt <= 150000) loanTier = "<=$150,000";
  else if (loanAmt <= 1000000) loanTier = "<=$1,000,000";
  else if (loanAmt <= 1500000) loanTier = "<=$1,500,000";
  else if (loanAmt <= 2000000) loanTier = "<=$2,000,000";
  else if (loanAmt <= 2500000) loanTier = "<=$2,500,000";
  else loanTier = "<=$3,000,000";

  const adj3 = OTHER_ADJUSTMENTS["Loan_Amount"][loanTier][ltvLabel];

  let dscrRange = "";
  if (dscr < 1.15) dscrRange = "< 1.15";
  else if (dscr <= 1.30) dscrRange = "> 1.15 <= 1.30";
  else dscrRange = "> 1.30";

  const adj4 = OTHER_ADJUSTMENTS["DSCR"][dscrRange][ltvLabel];

  const adj5 = OTHER_ADJUSTMENTS["Prepayment_Penalty"][request.prepaymentPenalty][ltvLabel];

  if (adj1 === "N/O" || adj2 === "N/O" || adj3 === "N/O" || adj4 === "N/O" || adj5 === "N/O") {
    return {
      transactionType: txType, ltvLabel, ficoRange, propertyTypeLabel: propTypeLabel, loanTier, dscrRange, prepayLabel: request.prepaymentPenalty,
      adj1, adj2, adj3, adj4, adj5,
      totalAdj: "N/O", initialPrice: "N/O", closestMatchPrice: "N/O", initialRate: "N/O", shiftedPrice: "N/O", finalMatchPrice: "N/O", finalRate: "N/O", isOffered: false
    };
  }

  const totalAdj = (adj1 as number) + (adj2 as number) + (adj3 as number) + (adj4 as number) + (adj5 as number);
  const initialPrice = 100 - totalAdj;

  const findClosest = (target: number) => {
    let closest = RATE_TABLE[0];
    let minDiff = Math.abs(RATE_TABLE[0].price - target);
    for (const entry of RATE_TABLE) {
      const diff = Math.abs(entry.price - target);
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }
    return closest;
  };

  const match1 = findClosest(initialPrice);
  const shiftedPrice = match1.price + 1.5;
  const match2 = findClosest(shiftedPrice);

  return {
    transactionType: txType, ltvLabel, ficoRange, propertyTypeLabel: propTypeLabel, loanTier, dscrRange, prepayLabel: request.prepaymentPenalty,
    adj1, adj2, adj3, adj4, adj5,
    totalAdj, initialPrice, closestMatchPrice: match1.price, initialRate: match1.rate, shiftedPrice, finalMatchPrice: match2.price, finalRate: match2.rate,
    isOffered: true
  };
};
