
import { LoanRequest, UnderwritingResult, LoanPurpose, AssetType } from "../types";

const CALC_RATE = 0.07; // 7% calculation rate for underwriting purposes
const AMORT_MONTHS = 360;

const calculatePI = (loanAmount: number, annualRate: number): number => {
  const monthlyRate = annualRate / 12;
  return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -AMORT_MONTHS));
};

export const calculateDSCRUnderwriting = (data: LoanRequest): UnderwritingResult => {
  const failures: string[] = [];
  const warnings: string[] = [];
  
  const effectiveFico = (data.isForeignNational && !data.ficoScore) ? 700 : (data.ficoScore || 0);
  const isMultiUnit = [AssetType.TWO_UNIT, AssetType.THREE_UNIT, AssetType.FOUR_UNIT].includes(data.assetType);

  // 1. Initial State/Geographic Declines
  const excludedStates = ['AK', 'ID', 'CA', 'MN', 'MT', 'NV', 'ND', 'OR', 'SD', 'VT'];
  if (excludedStates.includes(data.propertyState.toUpperCase())) {
    failures.push(`We do not lend in ${data.propertyState}.`);
  }
  if (data.isRural) failures.push("Rural properties are ineligible.");
  if (data.isShortTermRental && isMultiUnit) {
    failures.push("STR status is only eligible for Single Family properties.");
  }
  if (effectiveFico < 660 && !data.isForeignNational) {
    failures.push("Minimum FICO of 660 required.");
  }

  // Helper to get DSCR and PI for a specific LTV
  const getMetrics = (ltv: number) => {
    const loanAmt = data.asIsValue * ltv;
    const pi = calculatePI(loanAmt, CALC_RATE);
    const totalExp = pi + data.monthlyTax + data.monthlyInsurance + data.monthlyHoa;
    const dscr = data.monthlyRent / totalExp;
    return { dscr, totalExp, pi, loanAmt };
  };

  // 2. Determine Max Base LTV (Matrix)
  let baseMaxLtv = 0;
  if (effectiveFico >= 780) baseMaxLtv = 0.80;
  else if (effectiveFico >= 700) baseMaxLtv = 0.75;
  else if (effectiveFico >= 680) baseMaxLtv = 0.70;
  else if (effectiveFico >= 660) baseMaxLtv = 0.65;

  let currentLtv = baseMaxLtv;
  let metrics = getMetrics(currentLtv);

  // 3. Apply Cash-Out Rules
  const isCashOut = data.loanPurpose === LoanPurpose.REFI && data.isCashOut;
  if (isCashOut) {
    let cashOutLtvCap = 0.75;
    if (data.isShortTermRental || metrics.dscr < 1.0) {
      cashOutLtvCap = 0.70;
    }
    
    currentLtv = Math.min(currentLtv, cashOutLtvCap);
    metrics = getMetrics(currentLtv);

    let cashDollarCap = 500000;
    if (metrics.dscr >= 1.0 && !data.isShortTermRental) {
      if (currentLtv < 0.65) {
        cashDollarCap = 1000000;
      }
    }

    const currentPayoff = data.payoffAmount || 0;
    const maxLoanByDollarCap = currentPayoff + cashDollarCap;
    
    if (metrics.loanAmt > maxLoanByDollarCap) {
      currentLtv = maxLoanByDollarCap / data.asIsValue;
      metrics = getMetrics(currentLtv);
      warnings.push(`Proceeds Cap: Cash-out restricted to $${(cashDollarCap/1000).toLocaleString()}k max.`);
    }
  }

  // 4. Reserve Requirements (6 or 12 months)
  let requiredMonths = 6;
  if (metrics.dscr < 1.0) {
    requiredMonths = 12;
  } else if (metrics.loanAmt > 2000000) {
    requiredMonths = 12;
  } else if (data.isShortTermRental && metrics.loanAmt > 2000000) {
    // Redundant check but strictly following user prompt phrasing
    requiredMonths = 12;
  }
  
  const requiredReserves = metrics.totalExp * requiredMonths;
  if (data.liquidity < requiredReserves) {
    warnings.push(`Liquidity: $${Math.round(requiredReserves - data.liquidity).toLocaleString()} reserve shortfall.`);
  }

  // 5. Final Floor Checks
  if (metrics.dscr < 0.75) {
    failures.push("DSCR below 0.75x floor.");
    currentLtv = 0;
  }

  let band: 'Green' | 'Yellow' | 'Red' = 'Green';
  if (failures.length > 0) band = 'Red';
  else if (warnings.length > 0 || metrics.dscr < 1.1) band = 'Yellow';

  return {
    score: band === 'Red' ? 30 : (band === 'Yellow' ? 75 : 95),
    band,
    qualified: band !== 'Red',
    dscr: metrics.dscr,
    ltv: currentLtv,
    reserves: data.liquidity,
    requiredReserves,
    reserveMonths: requiredMonths,
    totalMonthlyPayment: metrics.totalExp,
    monthlyPI: metrics.pi,
    reasoning: [...failures, ...warnings].join(" "),
    ioEligible: effectiveFico >= 780 && metrics.dscr >= 1.0,
    documentChecklist: [],
    analysis: { narrativeSummary: '', whatsWorking: [], redFlags: [], deepDiveAreas: [], improvementChecklist: [] },
    sensitivity: { baseDscr: metrics.dscr, rateForDscr1: null, ltvForDscr1: null },
    estimatedCashOut: isCashOut ? Math.max(0, metrics.loanAmt - (data.payoffAmount || 0) - (metrics.loanAmt * 0.02)) : 0
  };
};
