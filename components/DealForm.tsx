
import React, { useState, useEffect } from 'react';
import { LoanRequest, LoanPurpose, AssetType } from '../types';

const PREPAY_OPTIONS = [
  "No Penalty", "12 Months", "24 Months", "36 Months", "48 Months", "60 Months"
];

// Simplified Zip-to-State Mapper
const getStateFromZip = (zip: string): string => {
  const code = parseInt(zip.substring(0, 3));
  if (isNaN(code)) return '';
  
  if (code >= 350 && code <= 369) return 'AL';
  if (code >= 995 && code <= 999) return 'AK';
  if (code >= 850 && code <= 865) return 'AZ';
  if (code >= 716 && code <= 729) return 'AR';
  if (code >= 900 && code <= 961) return 'CA';
  if (code >= 800 && code <= 816) return 'CO';
  if (code >= 60 && code <= 69) return 'CT';
  if (code >= 197 && code <= 199) return 'DE';
  if (code >= 320 && code <= 349) return 'FL';
  if (code >= 300 && code <= 319) return 'GA';
  if (code >= 967 && code <= 968) return 'HI';
  if (code >= 832 && code <= 838) return 'ID';
  if (code >= 600 && code <= 629) return 'IL';
  if (code >= 460 && code <= 479) return 'IN';
  if (code >= 500 && code <= 528) return 'IA';
  if (code >= 660 && code <= 679) return 'KS';
  if (code >= 400 && code <= 427) return 'KY';
  if (code >= 700 && code <= 714) return 'LA';
  if (code >= 39 && code <= 49) return 'ME';
  if (code >= 206 && code <= 219) return 'MD';
  if (code >= 10 && code <= 27) return 'MA';
  if (code >= 480 && code <= 499) return 'MI';
  if (code >= 550 && code <= 567) return 'MN';
  if (code >= 386 && code <= 397) return 'MS';
  if (code >= 630 && code <= 658) return 'MO';
  if (code >= 590 && code <= 599) return 'MT';
  if (code >= 680 && code <= 693) return 'NE';
  if (code >= 889 && code <= 898) return 'NV';
  if (code >= 30 && code <= 38) return 'NH';
  if (code >= 70 && code <= 89) return 'NJ';
  if (code >= 870 && code <= 884) return 'NM';
  if (code >= 100 && code <= 149) return 'NY';
  if (code >= 270 && code <= 289) return 'NC';
  if (code >= 580 && code <= 588) return 'ND';
  if (code >= 430 && code <= 459) return 'OH';
  if (code >= 730 && code <= 749) return 'OK';
  if (code >= 970 && code <= 979) return 'OR';
  if (code >= 150 && code <= 196) return 'PA';
  if (code >= 28 && code <= 29) return 'RI';
  if (code >= 290 && code <= 299) return 'SC';
  if (code >= 570 && code <= 577) return 'SD';
  if (code >= 370 && code <= 385) return 'TN';
  if (code >= 750 && code <= 799) return 'TX';
  if (code >= 840 && code <= 847) return 'UT';
  if (code >= 50 && code <= 59) return 'VT';
  if (code >= 220 && code <= 246) return 'VA';
  if (code >= 980 && code <= 994) return 'WA';
  if (code >= 247 && code <= 268) return 'WV';
  if (code >= 530 && code <= 549) return 'WI';
  if (code >= 820 && code <= 831) return 'WY';
  
  return 'TX'; // Default
};

interface DealFormProps {
  onSubmit: (data: LoanRequest) => void;
  isLoading: boolean;
}

const DealForm: React.FC<DealFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<LoanRequest>({
    zipCode: '',
    propertyState: 'TX',
    isRural: false,
    assetType: AssetType.SINGLE,
    numberOfUnits: 1,
    unitSize: 0,
    loanPurpose: LoanPurpose.PURCHASE,
    isCashOut: false,
    moreThanOneUnitVacant: false,
    purchasePrice: 0,
    asIsValue: 0,
    monthlyRent: 0,
    annualTax: 0,
    monthlyHoa: 0,
    annualInsurance: 0,
    ficoScore: 720,
    mortgageLates: false,
    liquidity: 0,
    isFirstTimeInvestor: false,
    isShortTermRental: false,
    payoffAmount: 0,
    isForeignNational: false,
    prepaymentPenalty: "60 Months"
  });

  const [noFico, setNoFico] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const formatWithCommas = (val: number | undefined) => {
    if (val === undefined) return '';
    if (val === 0) return '0';
    return val.toLocaleString('en-US');
  };

  const parseFormattedNumber = (val: string) => {
    const cleaned = val.replace(/,/g, '');
    if (cleaned === '') return 0;
    return parseFloat(cleaned) || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
      if (name === 'isForeignNational' && !finalValue) {
        setNoFico(false);
      }
    } else if (name === 'assetType') {
      finalValue = value as AssetType;
    } else if (name === 'loanPurpose') {
      finalValue = value as LoanPurpose;
    } else if (name === 'isCashOut' || name === 'moreThanOneUnitVacant') {
      finalValue = value === 'true';
    } else if (['zipCode', 'propertyState', 'prepaymentPenalty'].includes(name)) {
      finalValue = value;
    } else {
      finalValue = parseFormattedNumber(value);
    }

    setFormData(prev => {
      const next = { ...prev, [name]: finalValue };
      
      // Auto-populate state from zip
      if (name === 'zipCode' && finalValue.length >= 3) {
        next.propertyState = getStateFromZip(finalValue);
      }

      if (name === 'assetType') {
        if (finalValue === AssetType.SINGLE) next.numberOfUnits = 1;
        if (finalValue === AssetType.TWO_UNIT) next.numberOfUnits = 2;
        if (finalValue === AssetType.THREE_UNIT) next.numberOfUnits = 3;
        if (finalValue === AssetType.FOUR_UNIT) next.numberOfUnits = 4;
      }
      if (next.loanPurpose === LoanPurpose.PURCHASE) {
        next.asIsValue = next.purchasePrice || 0;
        next.isCashOut = false;
        next.moreThanOneUnitVacant = false;
      }
      return next;
    });

    if (errors.length > 0) setErrors([]);
  };

  const handleNoFicoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setNoFico(checked);
    setFormData(prev => ({ ...prev, ficoScore: checked ? 0 : 720 }));
    if (errors.length > 0) setErrors([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields: string[] = [];
    
    // Credit/Property Validation
    if (!noFico && !formData.ficoScore) missingFields.push("FICO Score");
    if (!formData.zipCode) missingFields.push("Zip Code");
    if (!formData.unitSize) missingFields.push("Unit Size");
    
    if (formData.loanPurpose === LoanPurpose.PURCHASE) {
      if (!formData.purchasePrice) missingFields.push("Purchase Price");
    } else {
      if (!formData.asIsValue) missingFields.push("Estimated Value");
      if (!formData.payoffAmount) missingFields.push("Current Payoff");
    }
    
    if (!formData.monthlyRent) missingFields.push("Estimated Rent");
    if (!formData.annualTax) missingFields.push("Annual Property Taxes");
    if (!formData.annualInsurance) missingFields.push("Annual Insurance");

    if (missingFields.length > 0) {
      setErrors(missingFields);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" noValidate>
      <div className="bg-indigo-900 p-8 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-white to-indigo-500 opacity-50"></div>
        <div className="flex flex-col items-center mb-4">
          <span className="text-2xl font-black text-white tracking-tighter leading-none">DOMUS</span>
          <span className="text-[10px] font-bold text-indigo-300 tracking-[0.3em] leading-none mt-1 uppercase">LENDING</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">DSCR Underwriting Portal</h2>
        <p className="text-indigo-200 text-sm mt-1 font-medium italic">Instant Scenario Review & Direct Matrix Pricing</p>
      </div>
      
      <div className="p-8 space-y-8">
        {errors.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
            <h4 className="text-rose-800 font-bold text-sm mb-2">Required fields missing:</h4>
            <ul className="list-disc list-inside text-rose-600 text-xs font-medium grid grid-cols-2 gap-x-4 gap-y-1">
              {errors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </div>
        )}

        <section className="space-y-4">
          <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest border-b border-slate-100 pb-2">1. Profile & Credit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                <span>FICO Score <span className="text-rose-500">*</span></span>
                {formData.isForeignNational && (
                  <span className="flex items-center gap-1 normal-case text-indigo-600 font-medium cursor-pointer">
                    <input type="checkbox" checked={noFico} onChange={handleNoFicoChange} className="w-3 h-3" id="noFicoToggle" /> <label htmlFor="noFicoToggle">No US Credit?</label>
                  </span>
                )}
              </label>
              <input required={!noFico} disabled={noFico} type="text" inputMode="numeric" name="ficoScore" value={noFico ? 'N/A' : formatWithCommas(formData.ficoScore)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${noFico ? 'bg-slate-50 text-slate-400 border-slate-200' : 'border-slate-300'} ${errors.includes("FICO Score") ? 'border-rose-300 ring-rose-50 ring-2' : ''}`} />
            </div>
            <div className="md:col-span-1 flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 self-end">
               <div className="flex items-center gap-2">
                <input type="checkbox" id="isFirstTimeInvestor" name="isFirstTimeInvestor" checked={formData.isFirstTimeInvestor} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" />
                <label htmlFor="isFirstTimeInvestor" className="text-sm font-medium text-slate-700">First Time Investor?</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isForeignNational" name="isForeignNational" checked={formData.isForeignNational} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" />
                <label htmlFor="isForeignNational" className="text-sm font-medium text-slate-700">Foreign National?</label>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest border-b border-slate-100 pb-2">2. Property & Terms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                  <span>Zip Code <span className="text-rose-500">*</span></span>
                  {formData.zipCode.length === 5 && (
                    <span className="text-[10px] text-indigo-600 font-black tracking-widest bg-indigo-50 px-2 rounded-full border border-indigo-100">{formData.propertyState}</span>
                  )}
                </label>
                <input required name="zipCode" value={formData.zipCode} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Zip Code") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} maxLength={5} placeholder="75201" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Prepayment Penalty <span className="text-rose-500">*</span></label>
                <select name="prepaymentPenalty" value={formData.prepaymentPenalty} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium">
                  {PREPAY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Asset Type <span className="text-rose-500">*</span></label>
                <select name="assetType" value={formData.assetType} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium">
                  {Object.values(AssetType).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Size (Sq Ft) <span className="text-rose-500">*</span></label>
                <input required type="text" inputMode="numeric" name="unitSize" value={formatWithCommas(formData.unitSize)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Unit Size") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} placeholder="e.g. 1200" />
              </div>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isRural" name="isRural" checked={formData.isRural} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" />
                <label htmlFor="isRural" className="text-sm font-medium text-slate-700">Rural Area?</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isShortTermRental" name="isShortTermRental" checked={formData.isShortTermRental} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" />
                <label htmlFor="isShortTermRental" className="text-sm font-medium text-slate-700">Short Term Rental (STR)?</label>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest border-b border-slate-100 pb-2">3. Financials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Loan Purpose <span className="text-rose-500">*</span></label>
              <select name="loanPurpose" value={formData.loanPurpose} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium">
                {Object.values(LoanPurpose).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {formData.loanPurpose === LoanPurpose.PURCHASE ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Purchase Price ($) <span className="text-rose-500">*</span></label>
                <input required type="text" inputMode="numeric" name="purchasePrice" value={formatWithCommas(formData.purchasePrice)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Purchase Price") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Estimated As-Is Value ($) <span className="text-rose-500">*</span></label>
                  <input required type="text" inputMode="numeric" name="asIsValue" value={formatWithCommas(formData.asIsValue)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Estimated Value") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Current Loan Payoff ($) <span className="text-rose-500">*</span></label>
                  <input required type="text" inputMode="numeric" name="payoffAmount" value={formatWithCommas(formData.payoffAmount)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Current Payoff") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input type="checkbox" id="isCashOut" name="isCashOut" checked={formData.isCashOut} onChange={handleChange} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" />
                  <label htmlFor="isCashOut" className="text-sm font-medium text-slate-700">Cash Out Refinance?</label>
                </div>
              </>
            )}
            
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Gross Monthly Rent ($) <span className="text-rose-500">*</span></label>
                <input required type="text" inputMode="numeric" name="monthlyRent" value={formatWithCommas(formData.monthlyRent)} onChange={handleChange} className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Estimated Rent") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} placeholder="Market Rent" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Annual Property Taxes ($) <span className="text-rose-500">*</span></label>
                <input required type="text" inputMode="numeric" name="annualTax" value={formatWithCommas(formData.annualTax)} onChange={handleChange} className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Annual Property Taxes") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Annual Insurance ($) <span className="text-rose-500">*</span></label>
                <input required type="text" inputMode="numeric" name="annualInsurance" value={formatWithCommas(formData.annualInsurance)} onChange={handleChange} className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Annual Insurance") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Monthly HOA ($) <span className="text-slate-400 font-normal lowercase">(Optional)</span></label>
                <input type="text" inputMode="numeric" name="monthlyHoa" value={formatWithCommas(formData.monthlyHoa)} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium" />
              </div>
            </div>
          </div>
        </section>

        <div className="pt-6">
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? 'Processing Scenarios & Matrix Pricing...' : 'Run Analysis Now'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default DealForm;
