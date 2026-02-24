import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Brain, Bone, AlertTriangle, Baby, Eye, Stethoscope, Pill, Activity, Droplets, Microscope, User, Ear, Circle, Zap, Shield } from "lucide-react";

interface SpecialtyDisplayProps { specialties: string[]; }

const SpecialtyDisplay = ({ specialties }: SpecialtyDisplayProps) => {
  const specialtyConfig: Record<string, { icon: any; color: string; description: string }> = {
    'cardiology': { icon: Heart, color: 'text-red-400', description: 'Heart and cardiovascular conditions.' },
    'neurology': { icon: Brain, color: 'text-purple-400', description: 'Nervous system disorders.' },
    'orthopedics': { icon: Bone, color: 'text-blue-400', description: 'Musculoskeletal system.' },
    'emergency medicine': { icon: AlertTriangle, color: 'text-orange-400', description: 'Urgent medical attention.' },
    'emergency': { icon: AlertTriangle, color: 'text-orange-400', description: 'Urgent medical attention.' },
    'pediatrics': { icon: Baby, color: 'text-pink-400', description: 'Medical care for children.' },
    'dermatology': { icon: Shield, color: 'text-green-400', description: 'Skin conditions.' },
    'gastroenterology': { icon: Stethoscope, color: 'text-teal-400', description: 'Digestive system.' },
    'pulmonology': { icon: Activity, color: 'text-cyan-400', description: 'Respiratory conditions.' },
    'endocrinology': { icon: Pill, color: 'text-yellow-400', description: 'Hormone-related conditions.' },
    'internal': { icon: Stethoscope, color: 'text-muted-foreground', description: 'Primary care.' },
    'general medicine': { icon: Stethoscope, color: 'text-muted-foreground', description: 'Primary care.' }
  };

  const getConfig = (s: string) => specialtyConfig[s.toLowerCase()] || specialtyConfig['general medicine'];

  return (
    <div className="w-full">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" />Recommended Specialties</h3>
        {specialties.map((s, i) => {
          const config = getConfig(s);
          const Icon = config.icon;
          return (
            <div key={i} className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5">
              <Icon className={`w-4 h-4 mr-3 ${config.color}`} />
              <span className={`font-medium text-sm ${config.color} capitalize`}>{s.replace(/_/g, ' ')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpecialtyDisplay;
