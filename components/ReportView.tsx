import React from 'react';
import { ValidationReport, Discrepancy } from '../types';
import { Button } from './Button';

interface ReportViewProps {
  report: ValidationReport;
  onReset: () => void;
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    INFO: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold border ${styles[severity as keyof typeof styles] || styles.INFO}`}>
      {severity}
    </span>
  );
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'MATCH') return <span className="text-green-500 text-xl">✓</span>;
  if (status === 'MISMATCH') return <span className="text-red-500 text-xl">✕</span>;
  return <span className="text-yellow-500 text-xl">?</span>;
};

export const ReportView: React.FC<ReportViewProps> = ({ report, onReset }) => {
  
  const isOverallValid = report.overallStatus === 'VALID';
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className={`p-8 rounded-2xl text-white shadow-xl ${isOverallValid ? 'bg-green-600' : 'bg-zome-dark'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-full">
             {isOverallValid 
               ? <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               : <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             }
          </div>
          <div>
            <h2 className="text-2xl font-bold">Relatório de Validação</h2>
            <p className="opacity-90 text-sm tracking-wider uppercase">{report.overallStatus === 'VALID' ? 'Contrato Verificado' : 'Atenção Requerida'}</p>
          </div>
        </div>
        <p className="text-white/90 leading-relaxed text-lg">
          {report.summary}
        </p>
      </div>

      {/* Entity Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Proprietários', data: report.entities.owners },
          { title: 'Compradores', data: report.entities.buyers },
          { title: 'Imóvel', data: report.entities.property },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-zome-dark">{item.title}</h3>
              <StatusIcon status={item.data.status} />
            </div>
            <p className="text-sm text-gray-600">{item.data.notes}</p>
          </div>
        ))}
      </div>

      {/* Discrepancies List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-zome-dark text-lg">Detalhes da Análise</h3>
        </div>
        
        {report.discrepancies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma discrepância encontrada.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {report.discrepancies.map((disc, idx) => (
              <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                   <div className="flex items-center gap-3">
                     <SeverityBadge severity={disc.severity} />
                     <span className="font-bold text-zome-dark">{disc.field}</span>
                   </div>
                </div>
                <p className="text-gray-700 mb-3">{disc.description}</p>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg text-sm">
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase">Documento Original</span>
                    <span className="text-zome-dark font-medium break-all">{disc.sourceDocValue || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase">No CPCV</span>
                    <span className="text-zome-red font-medium break-all">{disc.cpcvValue || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={onReset} variant="outline">
          Validar Novo Contrato
        </Button>
      </div>
    </div>
  );
};
