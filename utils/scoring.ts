
import { LoanRequest, UnderwritingResult, LoanPurpose, AssetType } from "../types";
import { calculateQuotedRate } from "./pricing";

const AMORT_MONTHS = 360;
const BASELINE_FEEDBACK_RATE = 7.0; // Hardcoded 7% for the initial feedback page

const calculateAmortizedPI = (loanAmount: number, annualRate: number): number => {
  const monthlyRate = annualRate / 100 / 12;
  return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -AMORT_MONTHS));
};

const calculateInterestOnly = (loanAmount: number, annualRate: number): number => {
  return (loanAmount * (annualRate / 100)) / 12;
};

export const calculateDSCRUnderwriting = (data: LoanRequest): UnderwritingResult => {
  const failures: string[] = [];
  const warnings: string[] = [];
  
  const effectiveFico = (data.isForeignNational && (!data.ficoScore || data.ficoScore === 0)) ? 700 : (data.ficoScore || 0);
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

  let baseMaxLtv = 0;
  if (effectiveFico >= 780) baseMaxLtv = 0.80;
  else if (effectiveFico >= 700) baseMaxLtv = 0.75;
  else if (effectiveFico >= 680) baseMaxLtv = 0.70;
  else baseMaxLtv = 0.65;

  let maxAllowedLtv = baseMaxLtv;
  const isCashOut = data.loanPurpose === LoanPurpose.REFI && data.isCashOut;
  const isRateAndTerm = data.loanPurpose === LoanPurpose.REFI && !data.isCashOut;

  if (isCashOut) {
    maxAllowedLtv = Math.min(maxAllowedLtv, 0.75);
    if (data.isShortTermRental) maxAllowedLtv = Math.min(maxAllowedLtv, 0.70);
  }

  // Calculate Requested Loan Amount
  let requestedLoanAmt = 0;
  const ltvCap = data.asIsValue * maxAllowedLtv;

  if (data.loanPurpose === LoanPurpose.PURCHASE) {
    requestedLoanAmt = (data.purchasePrice || data.asIsValue) * maxAllowedLtv;
  } else if (isCashOut) {
    requestedLoanAmt = ltvCap; // For cash out, assume they want the max
  } else if (isRateAndTerm) {
    // Loan amount is payoff + 2% of loan (L = P + 0.02L => 0.98L = P => L = P/0.98)
    // Capped by LTV threshold
    const targetLoan = (data.payoffAmount || 0) / 0.98;
    requestedLoanAmt = Math.min(targetLoan, ltvCap);
  } else {
    requestedLoanAmt = ltvCap;
  }

  const effectiveLtv = requestedLoanAmt / data.asIsValue;

  const getMetrics = (loanAmt: number, rate: number) => {
    const interestOnly = calculateInterestOnly(loanAmt, rate);
    const monthlyTax = (data.annualTax || 0) / 12;
    const monthlyInsurance = (data.annualInsurance || 0) / 12;
    const totalExp = interestOnly + monthlyTax + monthlyInsurance + data.monthlyHoa;
    const dscr = data.monthlyRent / totalExp;
    return { dscr, totalExp, pi: interestOnly, loanAmt };
  };

  const baselineMetrics = getMetrics(requestedLoanAmt, BASELINE_FEEDBACK_RATE);
  
  const pricing = calculateQuotedRate(data, effectiveLtv, baselineMetrics.dscr);

  if (!pricing.isOffered) {
    failures.push("This loan configuration is not offered.");
    return {
      score: 30, band: 'Red', qualified: false, dscr: 0, ltv: 0, reserves: 0, requiredReserves: 0, reserveMonths: 0,
      totalMonthlyPayment: 0, monthlyPI: 0, reasoning: "Configuration not offered.", 
      analysis: { narrativeSummary: '', whatsWorking: [], redFlags: [], deepDiveAreas: [], improvementChecklist: [] },
      documentChecklist: [], ioEligible: false, sensitivity: { baseDscr: 0, rateForDscr1: null, ltvForDscr1: null },
      pricingBreakdown: pricing
    };
  }

  // Reserves logic
  let requiredMonths = 6;
  if (baselineMetrics.dscr < 1.0 || baselineMetrics.loanAmt > 2000000) {
    requiredMonths = 12;
  }
  
  const requiredReserves = baselineMetrics.totalExp * requiredMonths;

  if (baselineMetrics.dscr < 0.75) {
    failures.push("DSCR below 0.75x floor.");
  }

  let band: 'Green' | 'Yellow' | 'Red' = 'Green';
  if (failures.length > 0) band = 'Red';
  else if (warnings.length > 0 || baselineMetrics.dscr < 1.1) band = 'Yellow';

  return {
    score: band === 'Red' ? 30 : (band === 'Yellow' ? 75 : 95),
    band,
    qualified: band !== 'Red',
    dscr: baselineMetrics.dscr,
    ltv: effectiveLtv,
    reserves: data.liquidity || 0,
    requiredReserves,
    reserveMonths: requiredMonths,
    totalMonthlyPayment: baselineMetrics.totalExp,
    monthlyPI: baselineMetrics.pi,
    reasoning: [...failures, ...warnings].join(" "),
    ioEligible: effectiveFico >= 780 && baselineMetrics.dscr >= 1.0,
    documentChecklist: [],
    analysis: { narrativeSummary: '', whatsWorking: [], redFlags: [], deepDiveAreas: [], improvementChecklist: [] },
    sensitivity: { baseDscr: baselineMetrics.dscr, rateForDscr1: null, ltvForDscr1: null },
    estimatedCashOut: isCashOut ? Math.max(0, baselineMetrics.loanAmt - (data.payoffAmount || 0) - (baselineMetrics.loanAmt * 0.02)) : 0,
    pricingBreakdown: pricing,
  };
};
