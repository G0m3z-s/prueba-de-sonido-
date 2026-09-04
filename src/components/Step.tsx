import React from 'react';
import { Card, SectionHeading, EducationalNote } from '@/components/ui/Layout';

export function Step({ 
  number, 
  title, 
  isActive, 
  isCompleted,
  children,
  explanation,
  explanationTitle,
  analogy
}: { 
  number: number, 
  title: string, 
  isActive: boolean, 
  isCompleted: boolean, 
  children: React.ReactNode,
  explanation: string,
  explanationTitle?: string,
  analogy?: string
}) {
  if (!isActive && !isCompleted) return null; // In step-by-step, only show up to current step

  return (
    <Card className={`mb-4 ${isActive ? 'ring-2 ring-blue-300 shadow-lg' : 'opacity-90'}`}>
      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
        <h3 className="text-sm font-bold text-blue-900 uppercase flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-blue-900 text-white shadow-md' : 'bg-green-500 text-white'}`}>
            {number}
          </span>
          {title}
        </h3>
        {isCompleted && !isActive && <span className="text-xs font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded border border-green-200">Completado</span>}
        {isActive && <span className="text-xs font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded animate-pulse border border-blue-200">En curso</span>}
      </div>
      
      <div className="mt-2">
        {children}
      </div>

      <EducationalNote title={explanationTitle} text={explanation} analogy={analogy} />
    </Card>
  );
}
