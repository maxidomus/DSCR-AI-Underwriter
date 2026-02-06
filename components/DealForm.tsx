import React, { useState } from 'react';
import { LoanRequest, LoanPurpose, AssetType } from '../types';

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

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
    monthlyTax: 0,
    monthlyHoa: 0,
    monthlyInsurance: 0,
    ficoScore: 720,
    mortgageLates: false,
    liquidity: 0,
    isFirstTimeInvestor: false,
    isShortTermRental: false,
    payoffAmount: 0,
    isForeignNational: false,
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
    } else if (['zipCode', 'propertyState'].includes(name)) {
      finalValue = value;
    } else {
      finalValue = parseFormattedNumber(value);
    }

    setFormData(prev => {
      const next = { ...prev, [name]: finalValue };
      
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

    // Clear errors when user types
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

    if (!noFico && !formData.ficoScore) missingFields.push("FICO Score");
    if (!formData.liquidity) missingFields.push("Total Liquidity");
    if (!formData.zipCode) missingFields.push("Zip Code");
    if (!formData.unitSize) missingFields.push("Unit Size");
    
    if (formData.loanPurpose === LoanPurpose.PURCHASE) {
      if (!formData.purchasePrice) missingFields.push("Purchase Price");
    } else {
      if (!formData.asIsValue) missingFields.push("Estimated Value");
      if (!formData.payoffAmount) missingFields.push("Current Payoff");
    }

    if (!formData.monthlyRent) missingFields.push("Estimated Rent");
    if (!formData.monthlyTax) missingFields.push("Property Taxes");
    if (!formData.monthlyInsurance) missingFields.push("Insurance");

    if (missingFields.length > 0) {
      setErrors(missingFields);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onSubmit(formData);
  };

  const isMultiUnit = [AssetType.TWO_UNIT, AssetType.THREE_UNIT, AssetType.FOUR_UNIT].includes(formData.assetType);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" noValidate>
      <div className="bg-indigo-900 p-8 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-white to-indigo-500 opacity-50"></div>
        <div className="flex flex-col items-center mb-4">
          <span className="text-2xl font-black text-white tracking-tighter leading-none">DOMUS</span>
          <span className="text-[10px] font-bold text-indigo-300 tracking-[0.3em] leading-none mt-1 uppercase">Lending</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">DSCR Underwriting Portal</h2>
        <p className="text-indigo-200 text-sm mt-1 font-medium">Instant Scenario Review & Market Research</p>
      </div>
      
      <div className="p-8 space-y-8">
        {errors.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
            <h4 className="text-rose-800 font-bold text-sm mb-2">Missing required fields to analyze deal:</h4>
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
              <input 
                required={!noFico} 
                disabled={noFico}
                type="text" 
                inputMode="numeric" 
                name="ficoScore" 
                value={noFico ? 'N/A' : formatWithCommas(formData.ficoScore)} 
                onChange={handleChange} 
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${noFico ? 'bg-slate-50 text-slate-400 border-slate-200' : 'border-slate-300'} ${errors.includes("FICO Score") ? 'border-rose-300 ring-rose-50 ring-2' : ''}`} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Total Liquidity ($) <span className="text-rose-500">*</span></label>
              <input required type="text" inputMode="numeric" name="liquidity" value={formatWithCommas(formData.liquidity)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Total Liquidity") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
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
          <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest border-b border-slate-100 pb-2">2. Property Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">State <span className="text-rose-500">*</span></label>
                <select name="propertyState" value={formData.propertyState} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium">
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Zip Code <span className="text-rose-500">*</span></label>
                <input required name="zipCode" value={formData.zipCode} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Zip Code") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} maxLength={5} placeholder="75201" />
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
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {isMultiUnit ? 'Avg. Unit Size (Sq Ft)' : 'Unit Size (Sq Ft)'} <span className="text-rose-500">*</span>
                </label>
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
          <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest border-b border-slate-100 pb-2">3. Financial Scenario</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Purpose <span className="text-rose-500">*</span></label>
              <select name="loanPurpose" value={formData.loanPurpose} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium">
                {Object.values(LoanPurpose).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {formData.loanPurpose === LoanPurpose.REFI && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Cash out? <span className="text-rose-500">*</span></label>
                <div className="flex gap-2 h-10 items-center">
                  <label className={`flex-1 flex items-center justify-center rounded-lg border py-2 cursor-pointer transition-all font-bold text-sm ${!formData.isCashOut ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                    <input type="radio" name="isCashOut" value="false" checked={!formData.isCashOut} onChange={handleChange} className="hidden" /> No
                  </label>
                  <label className={`flex-1 flex items-center justify-center rounded-lg border py-2 cursor-pointer transition-all font-bold text-sm ${formData.isCashOut ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                    <input type="radio" name="isCashOut" value="true" checked={formData.isCashOut} onChange={handleChange} className="hidden" /> Yes
                  </label>
                </div>
              </div>
            )}

            {formData.loanPurpose === LoanPurpose.REFI && isMultiUnit && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-rose-600 uppercase">More than one unit vacant? <span className="text-rose-500">*</span></label>
                <div className="flex gap-2 h-10 items-center">
                  <label className={`flex-1 flex items-center justify-center rounded-lg border py-2 cursor-pointer transition-all font-bold text-sm ${!formData.moreThanOneUnitVacant ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                    <input type="radio" name="moreThanOneUnitVacant" value="false" checked={!formData.moreThanOneUnitVacant} onChange={handleChange} className="hidden" /> No
                  </label>
                  <label className={`flex-1 flex items-center justify-center rounded-lg border py-2 cursor-pointer transition-all font-bold text-sm ${formData.moreThanOneUnitVacant ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                    <input type="radio" name="moreThanOneUnitVacant" value="true" checked={formData.moreThanOneUnitVacant} onChange={handleChange} className="hidden" /> Yes
                  </label>
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                {formData.loanPurpose === LoanPurpose.REFI ? 'Est. Value ($)' : 'Purchase Price ($)'} <span className="text-rose-500">*</span>
              </label>
              <input 
                required 
                type="text" 
                inputMode="numeric" 
                name={formData.loanPurpose === LoanPurpose.REFI ? "asIsValue" : "purchasePrice"} 
                value={formatWithCommas(formData.loanPurpose === LoanPurpose.REFI ? formData.asIsValue : formData.purchasePrice)} 
                onChange={handleChange} 
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes(formData.loanPurpose === LoanPurpose.REFI ? "Estimated Value" : "Purchase Price") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} 
              />
            </div>

            {formData.loanPurpose === LoanPurpose.REFI && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Payoff ($) <span className="text-rose-500">*</span></label>
                <input required type="text" inputMode="numeric" name="payoffAmount" value={formatWithCommas(formData.payoffAmount)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Current Payoff") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Estimated Rent ($/mo) <span className="text-rose-500">*</span></label>
              <input required type="text" inputMode="numeric" name="monthlyRent" value={formatWithCommas(formData.monthlyRent)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Estimated Rent") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Property Taxes ($/mo) <span className="text-rose-500">*</span></label>
              <input required type="text" inputMode="numeric" name="monthlyTax" value={formatWithCommas(formData.monthlyTax)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Property Taxes") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Insurance ($/mo) <span className="text-rose-500">*</span></label>
              <input required type="text" inputMode="numeric" name="monthlyInsurance" value={formatWithCommas(formData.monthlyInsurance)} onChange={handleChange} className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 font-medium ${errors.includes("Insurance") ? 'border-rose-300 ring-rose-50 ring-2' : 'border-slate-300'}`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">HOA Fee ($/mo)</label>
              <input type="text" inputMode="numeric" name="monthlyHoa" value={formatWithCommas(formData.monthlyHoa)} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="0 if none" />
            </div>
          </div>

          {formData.loanPurpose === LoanPurpose.REFI && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-3 mt-4">
              <input type="checkbox" id="mortgageLates" name="mortgageLates" checked={formData.mortgageLates} onChange={handleChange} className="w-5 h-5 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500" />
              <label htmlFor="mortgageLates" className="text-sm font-bold text-indigo-900 leading-tight">
                Do you have more than one 30-day late payments on your current mortgage?
              </label>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <button disabled={isLoading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
            {isLoading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Reviewing Deal...</>
            ) : "Analyze My Deal"}
          </button>
          <p className="text-[10px] text-slate-400 text-center font-medium uppercase tracking-widest">
            <span className="text-rose-500 font-bold">*</span> Indicates Required for Analysis
          </p>
        </div>
      </div>
    </form>
  );
};

export default DealForm;