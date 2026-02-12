import React, { useState, useEffect } from 'react';
import { UploadType, UploadedFile, ValidationReport } from './types';
import { validateDocuments } from './services/aiService';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';
import { FileUploader } from './components/FileUploader';
import { ReportView } from './components/ReportView';

// Icons
const UserIcon = () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BuyerIcon = () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const HomeIcon = () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const DocIcon = () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { type: UploadType.OWNER, title: "Documentos do Proprietário", description: "Cartão de Cidadão, Passaporte ou Título de residência.", icon: <UserIcon /> },
    { type: UploadType.BUYER, title: "Documentos do Comprador", description: "Cartão de Cidadão, Passaporte ou Título de residência.", icon: <BuyerIcon /> },
    { type: UploadType.PROPERTY, title: "Documentos do Imóvel", description: "Caderneta Predial, Certidão do Registo Predial e Certificado Energético.", icon: <HomeIcon /> },
    { type: UploadType.CPCV, title: "CPCV", description: "Contrato Promessa de Compra e Venda (rascunho ou assinado).", icon: <DocIcon /> },
  ];

  const handleFilesSelected = (newFiles: File[]) => {
    const uploaded = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: steps[currentStep].type,
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...uploaded]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      startAnalysis();
    }
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep(4); // Move to Analysis visual step
    setError(null);
    try {
      const result = await validateDocuments(files);
      setReport(result);
    } catch (err) {
      setError("Falha na análise dos documentos. Por favor verifique a chave API ou os ficheiros e tente novamente.");
      console.error(err);
      setCurrentStep(steps.length - 1); // Go back to last upload step on error
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setCurrentStep(0);
    setReport(null);
    setError(null);
  };

  const currentFiles = files.filter(f => f.type === steps[currentStep]?.type);
  const canProceed = currentStep < 4 ? currentFiles.length > 0 : false;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-zome-dark">
      {/* Header */}
      <header className="bg-zome-dark text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Simulated Zome Logo */}
            <div className="flex flex-col leading-none">
              <span className="text-3xl font-bold tracking-tighter">zome</span>
              <span className="text-[0.6rem] tracking-widest font-light">REAL ESTATE</span>
            </div>
            <div className="h-8 w-px bg-gray-600 mx-2"></div>
            <span className="font-light text-xl">CPCV Validator AI</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">

        {report ? (
          <ReportView report={report} onReset={handleReset} />
        ) : (
          <div className="max-w-3xl mx-auto">
            <ProgressBar currentStep={currentStep} />

            {isAnalyzing ? (
              <div className="text-center py-20 animate-pulse">
                <div className="w-20 h-20 border-4 border-zome-red border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-zome-dark mb-2">A Analisar Documentos...</h2>
                <p className="text-gray-500">A nossa IA está a comparar os dados do CPCV com a documentação oficial.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
                  <p className="text-gray-500">{steps[currentStep].description}</p>
                </div>

                <div className="space-y-6">
                  <FileUploader
                    type={steps[currentStep].type}
                    onFilesSelected={handleFilesSelected}
                    title="Carregar Ficheiros"
                    description={currentStep === 3 ? "Suporta PDF, DOC, DOCX" : "Suporta PDF, JPG, PNG"}
                    icon={steps[currentStep].icon}
                  />

                  {currentFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {currentFiles.map(file => (
                        <div key={file.id} className="relative group border rounded-lg overflow-hidden bg-gray-50">
                          <button
                            onClick={() => removeFile(file.id)}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          {file.file.type.startsWith('image/') ? (
                            <img src={file.previewUrl} className="w-full h-24 object-cover" alt="preview" />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center text-gray-400">
                              <span className="text-xs uppercase font-bold">PDF</span>
                            </div>
                          )}
                          <div className="p-2 text-xs truncate font-medium text-gray-600">
                            {file.file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-10 flex justify-end">
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed}
                    className="w-full md:w-auto"
                  >
                    {currentStep === steps.length - 1 ? 'Validar Contrato' : 'Próximo Passo'}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-8 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Zome Real Estate. Ferramenta de uso interno.</p>
      </footer>
    </div>
  );
};

export default App;
