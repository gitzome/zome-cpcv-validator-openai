import React from 'react';
import { UploadType } from '../types';

interface ProgressBarProps {
  currentStep: number;
}

const steps = [
  { label: 'Proprietário', type: UploadType.OWNER },
  { label: 'Comprador', type: UploadType.BUYER },
  { label: 'Imóvel', type: UploadType.PROPERTY },
  { label: 'CPCV', type: UploadType.CPCV },
  { label: 'Análise', type: 'ANALYSIS' },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative z-10">
        {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
                <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 border-4 
                        ${isActive ? 'bg-zome-red border-zome-red text-white scale-110 shadow-lg' : ''}
                        ${isCompleted ? 'bg-zome-dark border-zome-dark text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-400' : ''}
                        `}
                    >
                        {isCompleted ? '✓' : index + 1}
                    </div>
                    <span className={`mt-2 text-xs font-semibold hidden md:block uppercase tracking-wider ${isActive || isCompleted ? 'text-zome-dark' : 'text-gray-400'}`}>
                        {step.label}
                    </span>
                </div>
            );
        })}
      </div>
      {/* Connector Line */}
      <div className="relative -top-14 left-0 w-full h-1 bg-gray-200 -z-0">
         <div 
            className="h-full bg-zome-dark transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
         ></div>
      </div>
    </div>
  );
};
