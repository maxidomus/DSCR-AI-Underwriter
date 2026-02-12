
import React, { useState, useEffect } from 'react';
import { LoanRequest, UnderwritingResult } from './types';
import { calculateDSCRUnderwriting } from './utils/scoring';
import { analyzeDealWithAI } from './services/geminiService';
import DealForm from './components/DealForm';
import ResultView from './components/ResultView';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UnderwritingResult | null>(null);
  const [request, setRequest] = useState<LoanRequest | null>(null);
  const [isEmbed, setIsEmbed] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  // Using a key to force-reset the DealForm component state
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === 'true') {
      setIsEmbed(true);
    }
  }, []);

  const handleDealSubmit = async (data: LoanRequest) => {
    setLoading(true);
    setRequest(data);
    
    const quantitative = calculateDSCRUnderwriting(data);
    
    if (!quantitative.qualified) {
      setResult({ 
        ...quantitative,
        analysis: {
          narrativeSummary: "The current scenario does not meet the necessary criteria for our DSCR programs. Review the decline reasons for specific details.",
          whatsWorking: [],
          redFlags: [],
          deepDiveAreas: [],
          improvementChecklist: ["Adjust leverage or property occupancy status and re-run."]
        },
        documentChecklist: []
      });
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    try {
      const analysis = await analyzeDealWithAI(
        data, 
        quantitative.score, 
        quantitative.band, 
        quantitative.ltv, 
        quantitative.dscr,
        quantitative.totalMonthlyPayment
      );

      setResult({ 
        ...quantitative, 
        analysis, 
        documentChecklist: [] 
      });
    } catch (err) {
      console.error(err);
      setResult({ 
        ...quantitative,
        analysis: {
          narrativeSummary: "The quantitative analysis indicates a viable deal structure. Next steps involve market rent and valuation verification.",
          whatsWorking: ["Strong leverage and coverage profile"],
          redFlags: [],
          deepDiveAreas: ["Standard underwriting review required"],
          improvementChecklist: ["Connect with a rep for next steps"]
        },
        documentChecklist: []
      });
    } finally {
      setLoading(false);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setResult(null);
    setRequest(null);
    setFormKey(prev => prev + 1); // Force new instance of DealForm
  };

  const currentUrl = window.location.href.split('?')[0];
  const embedUrl = `${currentUrl}?embed=true`;
  const embedSnippet = `<iframe src="${embedUrl}" width="100%" height="900px" frameborder="0" style="border-radius:16px; border:1px solid #e2e8f0; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);"></iframe>`;

  return (
    <div className={`min-h-screen ${isEmbed ? 'bg-transparent' : 'bg-slate-50'} flex flex-col`}>
      {!isEmbed && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4 cursor-pointer" onClick={resetForm}>
              <div className="flex flex-col">
                <span className="text-xl font-black text-indigo-900 tracking-tighter leading-none">DOMUS</span>
                <span className="text-[10px] font-bold text-indigo-700 tracking-[0.25em] leading-none mt-0.5">LENDING</span>
              </div>
            </div>
            <button 
              onClick={resetForm} 
              className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:text-indigo-800 transition-colors"
            >
              Reset Tool
            </button>
          </div>
        </header>
      )}

      <main className={`flex-grow ${isEmbed ? 'p-0' : 'max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12'}`}>
        {!result ? (
          <div className="space-y-12">
            {!isEmbed && (
              <div className="text-center space-y-4 max-w-2xl mx-auto animate-in">
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                  Get an <span className="text-indigo-600 underline decoration-indigo-200 decoration-8 underline-offset-4 whitespace-nowrap">immediate quote</span> with actual rate and terms
                </h2>
                <p className="text-lg text-slate-600 font-medium">Instant analysis of cash-flow, leverage, and direct matrix pricing.</p>
              </div>
            )}
            <DealForm key={formKey} onSubmit={handleDealSubmit} isLoading={loading} />
          </div>
        ) : (
          <ResultView result={result} request={request!} onReset={resetForm} />
        )}
      </main>

      {!isEmbed && (
        <footer className="bg-slate-900 text-slate-500 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <button 
              onClick={() => setShowEmbedCode(true)}
              className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-900 px-6 py-2.5 rounded-full"
            >
              Get Website Embed Snippet
            </button>
          </div>
        </footer>
      )}

      {showEmbedCode && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">Embed on Your Website</h3>
              <button onClick={() => setShowEmbedCode(false)} className="text-slate-400 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">✕</button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 font-medium italic">Copy this code and paste it where you want the tool to appear on your site:</p>
              <pre className="bg-slate-900 p-6 rounded-2xl text-[11px] font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap select-all">
                {embedSnippet}
              </pre>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-xs text-amber-800 font-medium leading-relaxed">
                <strong>Note:</strong> Once you host this application, ensure the <code>src</code> attribute in the iframe code above matches your public URL.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
