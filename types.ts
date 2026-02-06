export enum AssetType {
  SINGLE = 'Single Property',
  TWO_UNIT = '2 Units',
  THREE_UNIT = '3 Units',
  FOUR_UNIT = '4 Units'
}

export enum LoanPurpose {
  PURCHASE = 'Purchase',
  REFI = 'Refinance'
}

export interface AnalysisResult {
  narrativeSummary: string;
  whatsWorking: string[];
  redFlags: string[];
  deepDiveAreas: string[];
  improvementChecklist: string[];
  groundingSources?: any[];
}

export interface SensitivityAnalysis {
  baseDscr: number;
  rateForDscr1: number | null;
  ltvForDscr1: number | null;
}

export interface LoanRequest {
  borrowerName?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  zipCode: string;
  propertyState: string;
  isRural: boolean;
  assetType: AssetType;
  numberOfUnits: number;
  unitSize: number;
  loanPurpose: LoanPurpose;
  isCashOut?: boolean;
  moreThanOneUnitVacant?: boolean;
  purchasePrice?: number;
  asIsValue: number;
  monthlyRent: number;
  monthlyTax: number;
  monthlyHoa: number;
  monthlyInsurance: number;
  ficoScore: number;
  mortgageLates: boolean;
  liquidity: number;
  isFirstTimeInvestor: boolean;
  isShortTermRental: boolean;
  payoffAmount?: number;
  isForeignNational: boolean;
}

export interface UnderwritingResult {
  score: number;
  band: 'Green' | 'Yellow' | 'Red';
  qualified: boolean;
  dscr: number;
  ltv: number;
  reserves: number;
  requiredReserves: number;
  reserveMonths: number;
  totalMonthlyPayment: number;
  monthlyPI: number;
  reasoning: string;
  analysis: AnalysisResult;
  documentChecklist: string[];
  ioEligible: boolean;
  sensitivity: SensitivityAnalysis;
  estimatedCashOut?: number;
}