
import React, { useState, useEffect, useRef } from 'react';
import { UnderwritingResult, LoanRequest, LoanPurpose, PricingBreakdown } from '../types';
import { calculateQuotedRate } from '../utils/pricing';

interface ResultViewProps {
  result: UnderwritingResult;
  request: LoanRequest;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, request, onReset }) => {
  const [submittedContact, setSubmittedContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDscrDetails, setShowDscrDetails] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  
  // Real pricing data calculated only after contact submission
  const [realPricing, setRealPricing] = useState<PricingBreakdown | null>(null);
  const [realPitia, setRealPitia] = useState<number | null>(null);

  const isDeclined = result.band === 'Red';
  const estimatedLoanAmount = request.asIsValue * result.ltv;
  const originationFeePercent = 1.00;
  const originationFeeDollar = estimatedLoanAmount * (originationFeePercent / 100);
  const underwritingFee = 1595;

  const calculatePI = (loanAmount: number, annualRate: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -360));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setContactInfo(prev => ({ ...prev, phone: value }));
  };

  const formatPhoneNumber = (digits: string) => {
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactInfo.phone.length !== 10) return;

    setIsSubmitting(true);

    const pricing = calculateQuotedRate(request, result.ltv, result.dscr);
    setRealPricing(pricing);

    let calculatedPitia: number | null = null;
    if (pricing.isOffered && typeof pricing.finalRate === 'number') {
      const pi = calculatePI(estimatedLoanAmount, pricing.finalRate);
      const monthlyTax = (request.annualTax || 0) / 12;
      const monthlyInsurance = (request.annualInsurance || 0) / 12;
      calculatedPitia = pi + monthlyTax + monthlyInsurance + (request.monthlyHoa || 0);
      setRealPitia(calculatedPitia);
    }

    const isManualReview = !!pricing?.requiresManualRateReview;
    const displayRate = isManualReview 
      ? 'Pending Review' 
      : (typeof pricing?.finalRate === 'number' ? `${pricing.finalRate.toFixed(3)}% (Fixed)` : 'TBD');

    const templateParams = {
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      property_type: request.assetType,
      zip_code: request.zipCode,
      state: request.propertyState,
      loan_purpose: `${request.loanPurpose}${request.isCashOut ? ' (Cash Out)' : ''}`,
      property_value: `$${request.asIsValue.toLocaleString()}`,
      estimated_loan: `$${estimatedLoanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      ltv: `${(result.ltv * 100).toFixed(0)}%`,
      dscr: `${result.dscr.toFixed(2)}x`,
      ai_summary: result.analysis.narrativeSummary,
      
      credit_score: request.ficoScore || 'N/A',
      interest_rate: displayRate,
      loan_term: '30 Years Fixed',
      prepayment_penalty: request.prepaymentPenalty,
      origination_fee: `1.00% ($${originationFeeDollar.toLocaleString(undefined, { maximumFractionDigits: 0 })})`,
      underwriting_fee: `$${underwritingFee.toLocaleString()}`,
      monthly_pitia: calculatedPitia ? `$${Math.round(calculatedPitia).toLocaleString()}` : 'TBD',
      estimated_proceeds: request.isCashOut ? `$${Math.round(result.estimatedCashOut || 0).toLocaleString()}` : 'N/A',
      
      real_rate: pricing.finalRate,
    };

    try {
      // @ts-ignore
      await window.emailjs.send('service_y6p4adn', 'template_xg8v06m', templateParams, 'MIZgi2SZdJIoRSsJM');
      setSubmittedContact(true);
    } catch (error) {
      console.error('EmailJS Error:', error);
      alert('There was an issue sending your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContactSection = () => {
    const isManualReview = !!realPricing?.requiresManualRateReview;
    const displayRate = isManualReview 
      ? 'Pending Review' 
      : (typeof realPricing?.finalRate === 'number' ? `${realPricing.finalRate.toFixed(3)}% (Fixed)` : 'TBD');

    const isPhoneValid = contactInfo.phone.length === 10;

    return (
      <div className={`${submittedContact ? 'bg-white' : 'bg-indigo-600'} rounded-2xl shadow-xl p-8 transition-colors duration-500`}>
        {!submittedContact ? (
          <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
            <h4 className="text-xl font-bold text-center text-white">Get an immediate quote with actual rate and terms</h4>
            <p className="text-sm text-indigo-100 text-center leading-relaxed">Fill out this form to unlock your <strong>real interest rate</strong> and official term sheet based on today's matrix.</p>
            <div className="space-y-3 mt-6">
              <input required type="text" placeholder="Full Name" className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-white/50 transition-all" value={contactInfo.name} onChange={e => setContactInfo({...contactInfo, name: e.target.value})} />
              <input required type="email" placeholder="Email Address" className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-white/50 transition-all" value={contactInfo.email} onChange={e => setContactInfo({...contactInfo, email: e.target.value})} />
              <div className="relative">
                <input required type="tel" placeholder="Cell Phone (10 Digits)" className={`w-full px-4 py-2.5 rounded-lg bg-white/10 border text-white placeholder-white/40 text-sm outline-none focus:ring-2 transition-all ${!isPhoneValid && contactInfo.phone.length > 0 ? 'border-rose-400 focus:ring-rose-400' : 'border-white/20 focus:ring-white/50'}`} value={formatPhoneNumber(contactInfo.phone)} onChange={handlePhoneChange} />
                {!isPhoneValid && contactInfo.phone.length > 0 && (
                  <span className="absolute -bottom-5 left-0 text-[10px] text-rose-200 font-bold uppercase tracking-tighter">10 digits required</span>
                )}
              </div>
            </div>
            <button type="submit" disabled={isSubmitting || !isPhoneValid} className="w-full bg-white text-indigo-600 py-4 rounded-xl font-extrabold hover:bg-indigo-50 transition shadow-2xl flex items-center justify-center gap-2 mt-6 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Finalizing Pricing...' : 'Unlock My Actual Interest Rate'}
            </button>
            <p className="text-[10px] text-indigo-200 text-center mt-3 font-medium uppercase tracking-wider">Actual matrix rates are refreshed every 24 hours</p>
          </form>
        ) : (
          <div className="animate-in fade-in zoom-in duration-700 text-slate-900">
            <div className="flex flex-col items-center mb-6 border-b border-slate-100 pb-4">
              <div className="flex flex-col items-center mb-2">
                <span className="text-xl font-black text-indigo-900 tracking-tighter leading-none">DOMUS</span>
                <span className="text-[10px] font-bold text-indigo-700 tracking-[0.3em] mt-1 uppercase">Lending</span>
              </div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest mt-2">Soft Quote Term Sheet</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Ref: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Loan Amount</span><span className="font-black text-indigo-600 text-xl">${estimatedLoanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">LTV Ratio</span><span className="font-bold text-slate-800 text-lg">{(result.ltv * 100).toFixed(0)}%</span></div>
                {request.isCashOut && (
                  <div className="flex flex-col col-span-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100"><span className="text-[10px] font-bold text-indigo-500 uppercase">Estimated Cash Out Proceeds</span><span className="font-black text-indigo-700 text-xl">${Math.round(result.estimatedCashOut || 0).toLocaleString()}</span></div>
                )}
                <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase">Interest Rate</span><span className="font-bold text-slate-800 text-lg">{displayRate}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase">Amortization</span><span className="font-bold text-slate-800 text-lg">30 Years</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase">Origination Fee</span><span className="font-bold text-slate-800">1.00% (${originationFeeDollar.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase">Underwriting Fee</span><span className="font-bold text-slate-800">${underwritingFee.toLocaleString()}</span></div>
              </div>

              {isManualReview && (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                  <p className="text-[11px] text-indigo-800 leading-relaxed font-bold">
                    Because the borrower is a foreign national with no US credit, a loan officer has to review the loan before committing to an interest rate.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-500 uppercase">Monthly Payment (PITIA)</span></div>
                <span className="font-black text-slate-900 text-xl">
                  {isManualReview || !realPitia ? 'TBD' : `$${Math.round(realPitia).toLocaleString()}`}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-1.5">Important Disclosure</p>
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">These terms are not final and are subject to validation by a member of the team and also underwriting. Final pricing and loan-to-value are dependent on third-party appraisal, verified credit, and property-specific factors. This is not a commitment to lend.</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 text-center font-medium">The Domus team will follow up at <strong>{contactInfo.email}</strong> shortly.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isDeclined) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in duration-700">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Underwriting Result</h3>
            <div className="bg-rose-900/50 px-4 py-2 rounded-lg border border-rose-500/50"><span className="text-lg font-black uppercase text-rose-400">Declined</span></div>
          </div>
          <div className="p-5 bg-rose-950/40 border border-rose-500/30 rounded-xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-3">Critical Declines</h4>
            <p className="text-lg font-medium text-white leading-relaxed">{result.reasoning}</p>
          </div>
        </div>
        {renderContactSection()}
        <button onClick={onReset} className="w-full text-slate-500 font-bold py-4">← Try another scenario</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in duration-700">
      <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-2xl font-bold tracking-tight">Executive Summary</h3>
          <div className="bg-emerald-500/20 px-4 py-2 rounded-lg border border-emerald-500/30"><span className="text-lg font-black uppercase text-emerald-400">Pre-Qualified</span></div>
        </div>
        <p className="text-xl leading-relaxed text-indigo-50 font-medium">{result.analysis.narrativeSummary || 'The scenario shows strong quantitative fundamentals for DSCR financing.'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
           {renderContactSection()}
        </div>
        
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6">
            <h3 className="text-indigo-600 font-bold text-sm uppercase tracking-wide border-b pb-2">Analysis Findings</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Strengths</h4>
                <ul className="space-y-2">
                  <li className="text-slate-700 text-sm flex items-start gap-2 font-medium"><div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></div>DSCR Coverage: {result.dscr.toFixed(2)}x (Qualifying View)</li>
                  {result.analysis.whatsWorking.map((s, i) => <li key={i} className="text-slate-700 text-sm flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></div>{s}</li>)}
                </ul>
              </div>
              {result.analysis.redFlags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase mb-2">Red Flags & Risks</h4>
                  <ul className="space-y-2">
                    {result.analysis.redFlags.map((r, i) => <li key={i} className="text-slate-700 text-sm flex items-start gap-2"><div className="mt-1 w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></div>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <h3 className="text-indigo-600 font-bold mb-4 text-sm uppercase tracking-wide">Financial Recap</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-500 text-sm font-medium">Loan Amount</span><span className="font-extrabold text-indigo-600 text-xl">${estimatedLoanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-500 text-sm font-medium">Leverage (LTV)</span><span className="font-extrabold text-slate-800">{(result.ltv * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-500 text-sm font-medium">Debt Coverage (DSCR)</span><span className={`font-extrabold ${result.dscr < 1.0 ? 'text-rose-600' : 'text-emerald-600'}`}>{result.dscr.toFixed(2)}x</span></div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 bg-indigo-50/50 -mx-6 px-6"><span className="text-indigo-700 text-sm font-bold">Required Liquidity</span><span className="font-extrabold text-indigo-900">${Math.round(result.requiredReserves).toLocaleString()}</span></div>
              <button onClick={() => setShowDscrDetails(!showDscrDetails)} className="w-full text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors py-2 flex items-center justify-center gap-1">{showDscrDetails ? 'Collapse Payment Details' : 'View Full PITIA Breakdown'}</button>
              {showDscrDetails && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 animate-in slide-in-from-top-2">
                  <div className="flex justify-between text-xs"><span>Gross Monthly Rent</span><span className="font-bold">${request.monthlyRent.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span>Interest Pmt (@ 7.00% IO)</span><span className="font-bold">${Math.round(result.monthlyPI).toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span>Monthly Taxes</span><span className="font-bold">${Math.round(request.annualTax / 12).toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span>Monthly Insurance</span><span className="font-bold">${Math.round(request.annualInsurance / 12).toLocaleString()}</span></div>
                  {request.monthlyHoa > 0 && (
                    <div className="flex justify-between text-xs"><span>Monthly HOA</span><span className="font-bold">${request.monthlyHoa.toLocaleString()}</span></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center pt-8"><button onClick={onReset} className="bg-slate-200 text-slate-700 px-10 py-4 rounded-full font-bold hover:bg-slate-300 transition-all shadow-md active:scale-95">Run Another Scenario</button></div>
    </div>
  );
};

export default ResultView;
