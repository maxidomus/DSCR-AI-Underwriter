
import React, { useState } from 'react';
import { UnderwritingResult, LoanRequest, LoanPurpose } from '../types';

interface ResultViewProps {
  result: UnderwritingResult;
  request: LoanRequest;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, request, onReset }) => {
  const [submittedContact, setSubmittedContact] = useState(false);
  const [showDscrDetails, setShowDscrDetails] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });

  const isDeclined = result.band === 'Red';
  const hasLiquidityShortfall = result.reserves < result.requiredReserves;
  const estimatedLoanAmount = request.asIsValue * result.ltv;
  
  const checklistItems = [
    "Government Issued Photo ID",
    "LLC Entity Documents",
    request.loanPurpose === LoanPurpose.PURCHASE ? "Fully Executed Purchase Contract" : "Current Mortgage Payoff Statement",
    "2 Most Recent Bank Statements (Full)",
    "Lease Agreement (or Rent Roll if Multi-unit)",
  ].filter(Boolean);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedContact(true);
  };

  const HelpForm = () => (
    <div className="bg-indigo-600 rounded-2xl shadow-xl text-white p-8">
      {!submittedContact ? (
        <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
          <h4 className="text-xl font-bold text-center">Let's see how we can help!</h4>
          <p className="text-sm text-indigo-100 text-center leading-relaxed">Connect with a specialist to find the best loan structure for your goals.</p>
          <div className="space-y-3 mt-6">
            <input required type="text" placeholder="Full Name" className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-white/50 transition-all" value={contactInfo.name} onChange={e => setContactInfo({...contactInfo, name: e.target.value})} />
            <input required type="email" placeholder="Email Address" className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-white/50 transition-all" value={contactInfo.email} onChange={e => setContactInfo({...contactInfo, email: e.target.value})} />
            <input required type="tel" placeholder="Cell Phone" className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-white/50 transition-all" value={contactInfo.phone} onChange={e => setContactInfo({...contactInfo, phone: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-white text-indigo-600 py-4 rounded-xl font-extrabold hover:bg-indigo-50 transition shadow-2xl flex items-center justify-center gap-2 mt-4 active:scale-95">
            Connect with a Specialist
          </button>
        </form>
      ) : (
        <div className="py-12 space-y-4 animate-in fade-in zoom-in duration-500 text-center">
          <div className="w-16 h-16 bg-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"><svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
          <h4 className="text-2xl font-bold">Deal Sent to Desk</h4>
          <p className="text-indigo-100 max-w-xs mx-auto text-sm">Our specialists will review your ${estimatedLoanAmount.toLocaleString(undefined, {maximumFractionDigits: 0})} scenario immediately.</p>
        </div>
      )}
    </div>
  );

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
        <HelpForm />
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
          <div className="bg-emerald-500/20 px-4 py-2 rounded-lg border border-emerald-500/30">
            <span className="text-lg font-black uppercase text-emerald-400">Pre-Qualified</span>
          </div>
        </div>
        <p className="text-xl leading-relaxed text-indigo-50 font-medium">
          {result.analysis.narrativeSummary || 'The scenario shows strong quantitative fundamentals for DSCR financing.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Deal Health & Risks */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6">
            <h3 className="text-indigo-600 font-bold text-sm uppercase tracking-wide border-b pb-2">Analysis Findings</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Strengths</h4>
                <ul className="space-y-2">
                  <li className="text-slate-700 text-sm flex items-start gap-2 font-medium">
                    <div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></div>
                    DSCR Coverage: {result.dscr.toFixed(2)}x
                  </li>
                  {result.analysis.whatsWorking.map((s, i) => (
                    <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                      <div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></div>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {(result.analysis.redFlags.length > 0 || hasLiquidityShortfall) && (
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase mb-2">Red Flags & Risks</h4>
                  <ul className="space-y-2">
                    {hasLiquidityShortfall && (
                      <li className="text-rose-700 text-sm flex items-start gap-2 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <div className="mt-1 w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></div>
                        Reserve Shortfall: ${Math.round(result.requiredReserves - result.reserves).toLocaleString()} gap from {result.reserveMonths}-month requirement.
                      </li>
                    )}
                    {result.analysis.redFlags.map((r, i) => (
                      <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                        <div className="mt-1 w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></div>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                <strong>Important:</strong> A 7.00% interest rate is used strictly for underwriting calculations. Final terms are subject to full review and may differ based on market conditions.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <h3 className="text-indigo-600 font-bold mb-4 text-sm uppercase tracking-wide">Liquidity Audit</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Requirement</span>
                <span className="text-lg font-black text-slate-700">${Math.round(result.requiredReserves).toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">({result.reserveMonths} Months PITIA)</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Current Balance</span>
                <span className={`text-lg font-black ${hasLiquidityShortfall ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${result.reserves.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">Reported Liquidity</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Financial Recap</h3>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded">7.0% CALC RATE</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm font-medium">Qualifying Loan Amount</span>
                <span className="font-extrabold text-indigo-600 text-xl">${estimatedLoanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              
              {request.isCashOut && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100 bg-indigo-50/30 px-3 rounded-lg">
                  <span className="text-indigo-700 text-sm font-bold">Est. Net Proceeds</span>
                  <span className="font-black text-indigo-800 text-lg">${Math.round(result.estimatedCashOut || 0).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm font-medium">Leverage (LTV)</span>
                <span className="font-extrabold text-slate-800">{(result.ltv * 100).toFixed(0)}%</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm font-medium">Debt Coverage (DSCR)</span>
                <span className={`font-extrabold ${result.dscr < 1.0 ? 'text-rose-600' : 'text-emerald-600'}`}>{result.dscr.toFixed(2)}x</span>
              </div>
              
              <button onClick={() => setShowDscrDetails(!showDscrDetails)} className="w-full text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors py-2 flex items-center justify-center gap-1">
                {showDscrDetails ? 'Collapse Payment Details' : 'View Full PITIA Breakdown'}
              </button>

              {showDscrDetails && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 animate-in slide-in-from-top-2">
                  <div className="flex justify-between text-xs"><span>Gross Monthly Rent</span><span className="font-bold">${request.monthlyRent.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span>P&I (@ 7.00%)</span><span className="font-bold">${Math.round(result.monthlyPI).toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span>Taxes / Ins / HOA</span><span className="font-bold">${(request.monthlyTax + request.monthlyInsurance + request.monthlyHoa).toLocaleString()}</span></div>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <div className="flex justify-between text-xs font-bold text-indigo-600"><span>Total Underwriting Payment</span><span>${Math.round(result.totalMonthlyPayment).toLocaleString()}</span></div>
                </div>
              )}
            </div>
          </div>
          <HelpForm />
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button onClick={onReset} className="bg-slate-200 text-slate-700 px-10 py-4 rounded-full font-bold hover:bg-slate-300 transition-all shadow-md active:scale-95">Run Another Scenario</button>
      </div>
    </div>
  );
};

export default ResultView;
