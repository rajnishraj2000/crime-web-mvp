import { useState, useEffect } from 'react';
import { Sparkles, Save, Upload, AlertCircle, Plus, FileText } from 'lucide-react';
import { getCases, extractEntities, createReport, createCase } from '../services/api';
import { Case } from '../types';
import EntityBadge from '../components/EntityBadge';
import RiskBadge from '../components/RiskBadge';

const SAMPLE_TEXT = `First Information Report (FIR)
Date: 2024-03-15
Location: New Delhi Cyber Cell

Complainant Rahul Sharma reported an unauthorized transfer of ₹50,000 from his HDFC Bank account (Acct: 445566778899) to a suspected fraudulent account (Acct: 112233445566) held at SBI. 
Investigation revealed the SBI account is linked to phone number +91-9876543210, which belongs to a suspect named Amit Kumar. 
Amit Kumar has been previously flagged in connection with the "Jamtara Cyber Syndicate", a known criminal organization. 
A vehicle (DL-4C-AB-1234) registered to Amit Kumar was spotted near the ATM where the funds were quickly withdrawn.`;

export default function UploadReport() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>('');
  
  // New Case States
  const [isNewCase, setIsNewCase] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');

  const [reportType, setReportType] = useState('FIR');
  const [text, setText] = useState(SAMPLE_TEXT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const loadCases = () => {
    getCases().then(setCases).catch(console.error);
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExtract = async () => {
    let targetCaseId = selectedCase;

    // Handle new case creation on the fly
    if (isNewCase) {
      if (!newCaseTitle) {
        alert('Please enter a title for the new case.');
        return;
      }
      try {
        setLoading(true);
        const created = await createCase({ title: newCaseTitle, description: newCaseDesc });
        setCases(prev => [created, ...prev]);
        targetCaseId = created.id;
        setSelectedCase(created.id);
        setIsNewCase(false);
        setNewCaseTitle('');
        setNewCaseDesc('');
      } catch (err) {
        console.error(err);
        alert('Failed to create new case.');
        setLoading(false);
        return;
      }
    }

    if (!targetCaseId || !text) {
      alert('Please select a case and enter report text.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // API returns { message, data: { entities, relationships } }
      const response = await extractEntities({ text, caseId: targetCaseId });
      setResult(response.data); // Properly set result to the nested data object

      // Notify the sidebar to refresh the active cases list
      window.dispatchEvent(new CustomEvent('cases-updated'));
    } catch (err) {
      console.error(err);
      alert('Failed to extract entities.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCase || !text) return;
    try {
      await createReport({ caseId: selectedCase, text, reportType });
      alert('Report saved and graph updated successfully!');
      setResult(null);
      setText('');

      // Notify the sidebar to refresh the active cases list
      window.dispatchEvent(new CustomEvent('cases-updated'));
    } catch (err) {
      console.error(err);
      alert('Failed to save report.');
    }
  };

  // Helper to resolve entity IDs to names for the UI table
  const getEntityName = (id: string) => {
    const entity = result?.entities?.find((e: any) => e.id === id);
    return entity ? (entity.name || entity.label || id) : id;
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full overflow-y-auto scrollbar-subtle">
      <div className="mb-6 md:mb-8 ml-10 md:ml-0">
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" /> Upload Report
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Submit unstructured intelligence to extract entities and map relationships.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column: Input Form */}
        <div className="bg-[#111827] border border-slate-700/50 p-4 md:p-6 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-400">Target Case</label>
                <button 
                  onClick={() => setIsNewCase(!isNewCase)} 
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  {isNewCase ? 'Select Existing' : <><Plus className="w-3 h-3" /> New Case</>}
                </button>
              </div>
              
              {isNewCase ? (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Case Title" 
                    value={newCaseTitle} 
                    onChange={e => setNewCaseTitle(e.target.value)} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
                  />
                  <input 
                    type="text" 
                    placeholder="Description (Optional)" 
                    value={newCaseDesc} 
                    onChange={e => setNewCaseDesc(e.target.value)} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
                  />
                </div>
              ) : (
                <select 
                  value={selectedCase}
                  onChange={e => setSelectedCase(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">Select a case...</option>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Report Type</label>
              <select 
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="FIR">First Information Report (FIR)</option>
                <option value="CDR">Call Data Record (CDR)</option>
                <option value="FINANCIAL">Financial Statement</option>
                <option value="SURVEILLANCE">Surveillance Log</option>
              </select>
            </div>
          </div>

          <div className="mb-4 mt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-400">Raw Report Text</label>
              <label className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                <FileText className="w-3 h-3" /> Upload File
                <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full h-48 sm:h-64 md:h-80 bg-slate-800/50 border border-slate-700 rounded-lg p-3 md:p-4 text-slate-200 font-mono text-sm resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 scrollbar-subtle"
              placeholder="Paste unstructured intelligence here..."
            />
          </div>

          <button
            onClick={handleExtract}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <span className="animate-pulse">Analyzing with AI...</span>
            ) : (
              <><Sparkles className="w-5 h-5" /> Extract Entities & Relationships</>
            )}
          </button>
        </div>

        {/* Right Column: Extraction Results */}
        <div className="bg-[#111827] border border-slate-700/50 p-4 md:p-6 rounded-xl shadow-lg flex flex-col min-h-[300px] md:h-[600px]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-500" /> Extraction Results
          </h2>
          
          {!result ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic border-2 border-dashed border-slate-700 rounded-lg p-4 text-center">
              Run extraction to see AI analysis results here.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-subtle pr-1 md:pr-2 flex flex-col gap-6">
              
              {/* Entities Table */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Identified Entities ({result.entities?.length || 0})</h3>
                <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[320px]">
                    <thead className="bg-slate-800/80 text-slate-400">
                      <tr>
                        <th className="px-3 md:px-4 py-2 font-medium">Name</th>
                        <th className="px-3 md:px-4 py-2 font-medium">Type</th>
                        <th className="px-3 md:px-4 py-2 font-medium">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {result.entities?.map((e: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/50">
                          <td className="px-3 md:px-4 py-2 text-slate-200 font-medium truncate max-w-[150px]">{e.name || e.label}</td>
                          <td className="px-3 md:px-4 py-2"><EntityBadge type={e.type} /></td>
                          <td className="px-3 md:px-4 py-2">{e.riskLevel ? <RiskBadge level={e.riskLevel} /> : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relationships Table */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Mapped Relationships ({result.relationships?.length || 0})</h3>
                <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[320px]">
                    <thead className="bg-slate-800/80 text-slate-400">
                      <tr>
                        <th className="px-3 md:px-4 py-2 font-medium">Source</th>
                        <th className="px-3 md:px-4 py-2 font-medium">Relation</th>
                        <th className="px-3 md:px-4 py-2 font-medium">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {result.relationships?.map((r: any, i: number) => {
                        const sourceName = getEntityName(r.sourceId);
                        const targetName = getEntityName(r.targetId);
                        return (
                          <tr key={i} className="hover:bg-slate-800/50">
                            <td className="px-3 md:px-4 py-2 text-slate-300 truncate max-w-[100px] md:max-w-[120px]" title={sourceName}>{sourceName}</td>
                            <td className="px-3 md:px-4 py-2 text-cyan-400 font-mono text-xs">{r.type}</td>
                            <td className="px-3 md:px-4 py-2 text-slate-300 truncate max-w-[100px] md:max-w-[120px]" title={targetName}>{targetName}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-700">
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <Save className="w-5 h-5" /> Save to Knowledge Graph
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
