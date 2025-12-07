
import React from 'react';
import { Smartphone, Layers } from 'lucide-react';
import { CreativeFormat } from '../types';

interface FormatSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormats: Set<CreativeFormat>;
  onSelectFormat: (fmt: CreativeFormat) => void;
  onConfirm: () => void;
  formatGroups: Record<string, CreativeFormat[]>;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ isOpen, onClose, selectedFormats, onSelectFormat, onConfirm, formatGroups }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
              <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div><h2 className="text-xl font-display font-bold text-slate-900">Select Creative Formats</h2><p className="text-sm text-slate-500">Choose formats to generate for this angle.</p></div>
                      <div className="flex gap-3">
                          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg font-bold text-sm">Cancel</button>
                          <button onClick={onConfirm} disabled={selectedFormats.size === 0} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20 transition-all">Generate {selectedFormats.size} Creatives</button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-8">
                          {Object.entries(formatGroups).map(([group, formats]) => (
                              <div key={group} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">{group.includes("Instagram") ? <Smartphone className="w-3.5 h-3.5"/> : <Layers className="w-3.5 h-3.5"/>}{group}</h3>
                                  <div className="grid grid-cols-2 gap-3">
                                      {formats.map(fmt => (
                                          <button key={fmt} onClick={() => onSelectFormat(fmt)} className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${selectedFormats.has(fmt) ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'}`}>{fmt}</button>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
    );
}

export default FormatSelector;
