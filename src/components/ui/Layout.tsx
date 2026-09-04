import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200 p-4", className)}>
      {children}
    </div>
  );
}

export function Button({ 
  className, variant = 'primary', size = 'md', ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline', size?: 'sm' | 'md' | 'lg' }) {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded-md";
  const variants = {
    primary: "bg-blue-900 text-white hover:bg-blue-800",
    secondary: "bg-yellow-500 text-blue-900 hover:bg-yellow-400",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700"
  };
  const sizes = {
    sm: "py-1 px-2 text-[10px]",
    md: "py-2 px-4 text-xs",
    lg: "py-3 px-6 text-sm"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function SectionHeading({ title, subtitle }: { title: string, subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
        {title}
      </h2>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

export function EducationalNote({ text, title = "¿Por qué es importante este paso?", analogy }: { text: string, title?: string, analogy?: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 p-5 mt-5 rounded-xl shadow-sm">
      <h4 className="font-bold text-blue-900 mb-2 uppercase tracking-wide flex items-center gap-2 text-sm">
        <span className="bg-blue-200 text-blue-900 w-7 h-7 rounded-full flex items-center justify-center shadow-inner">💡</span> 
        {title}
      </h4>
      <p className="text-gray-700 leading-relaxed mb-4 text-sm">{text}</p>
      {analogy && (
        <div className="bg-white p-4 rounded-lg border border-blue-100 text-gray-700 shadow-sm flex flex-col md:flex-row gap-3 items-start">
          <span className="text-2xl" role="img" aria-label="analogy">👀</span>
          <div>
            <strong className="text-blue-900 uppercase text-xs tracking-wider block mb-1">Analogía Visual / Ejemplo Cotidiano</strong>
            <p className="text-sm italic">{analogy}</p>
          </div>
        </div>
      )}
    </div>
  );
}
