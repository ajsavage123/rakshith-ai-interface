import React from 'react';
import { Heart, Brain, Bone, AlertTriangle, Baby, Shield, Stethoscope, Pill, Activity, Zap } from "lucide-react";

interface SpecialtyRecommendationProps { specialties: string[]; }

const SpecialtyRecommendation = ({ specialties }: SpecialtyRecommendationProps) => {
  const uniqueSpecialties = Array.from(new Set(specialties.map(s => s.toLowerCase().trim())));
  const config: Record<string, { icon: any; color: string; description: string }> = {
    'cardiology': { icon: Heart, color: 'text-red-400', description: 'Heart and cardiovascular conditions.' },
    'neurology': { icon: Brain, color: 'text-purple-400', description: 'Nervous system disorders.' },
    'orthopedics': { icon: Bone, color: 'text-blue-400', description: 'Musculoskeletal system.' },
    'emergency': { icon: AlertTriangle, color: 'text-orange-400', description: 'Urgent care.' },
    'gastroenterology': { icon: Stethoscope, color: 'text-teal-400', description: 'Digestive system.' },
    'pulmonology': { icon: Activity, color: 'text-cyan-400', description: 'Respiratory conditions.' },
    'endocrinology': { icon: Pill, color: 'text-yellow-400', description: 'Hormone conditions.' },
    'internal': { icon: Stethoscope, color: 'text-muted-foreground', description: 'Primary care.' },
    'general medicine': { icon: Stethoscope, color: 'text-muted-foreground', description: 'Primary care.' }
  };

  const getConfig = (s: string) => config[s] || config['general medicine'];

  return (
    <div className="w-full space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" />Recommended Specialties</h3>
      {uniqueSpecialties.map((s, i) => {
        const c = getConfig(s);
        const Icon = c.icon;
        return (
          <div key={i} className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5">
            <Icon className={`w-4 h-4 mr-3 ${c.color}`} />
            <div>
              <span className={`font-medium text-sm ${c.color} capitalize`}>{s.replace(/_/g, ' ')}</span>
              <p className="text-xs text-muted-foreground">{c.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SpecialtyRecommendation;
