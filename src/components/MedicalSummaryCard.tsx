import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Stethoscope, Clock, Info, AlertTriangle, CheckCircle, TestTube } from "lucide-react";

interface MedicalSummaryCardProps { summary: string; summaryType?: string; }

const getUrgencyLevel = (summary: string) => {
  if (!summary) return null;
  const lower = summary.toLowerCase();
  if (lower.includes('high')) return 'high';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('low')) return 'low';
  return null;
};

const MedicalSummaryCard = ({ summary, summaryType }: MedicalSummaryCardProps) => {
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      const isListItem = trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || /^\d+\./.test(trimmedLine);
      if (isListItem) {
        const cleanText = trimmedLine.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
        return (<div key={index} className="flex items-start space-x-3 ml-2 mb-2"><span className="text-muted-foreground mt-1 flex-shrink-0">•</span><p className="text-sm text-foreground/80 flex-1 leading-relaxed">{cleanText}</p></div>);
      }
      return <p key={index} className="text-sm text-foreground/80 mb-2 leading-relaxed">{trimmedLine}</p>;
    }).filter(Boolean);
  };

  const urgencyLevel = summaryType?.toLowerCase().includes('urgency') ? getUrgencyLevel(summary) : null;
  const getAccentColor = () => {
    if (summaryType?.toLowerCase().includes('urgency')) return urgencyLevel === 'high' ? 'border-destructive/25 bg-destructive/8' : urgencyLevel === 'medium' ? 'border-yellow-500/25 bg-yellow-500/8' : 'border-success/25 bg-success/8';
    if (summaryType?.toLowerCase().includes('first aid')) return 'border-destructive/25 bg-destructive/8';
    if (summaryType?.toLowerCase().includes('investigation')) return 'border-success/25 bg-success/8';
    return 'border-primary/25 bg-primary/8';
  };

  const getIcon = () => {
    if (summaryType?.toLowerCase().includes('summary') || summaryType?.toLowerCase().includes('case')) return <Stethoscope className="w-5 h-5 text-primary" />;
    if (summaryType?.toLowerCase().includes('urgency')) return urgencyLevel === 'high' ? <AlertTriangle className="w-5 h-5 text-destructive" /> : urgencyLevel === 'low' ? <CheckCircle className="w-5 h-5 text-success" /> : <Info className="w-5 h-5 text-yellow-500" />;
    if (summaryType?.toLowerCase().includes('first aid')) return <Heart className="w-5 h-5 text-destructive" />;
    if (summaryType?.toLowerCase().includes('investigation')) return <TestTube className="w-5 h-5 text-success" />;
    return <Stethoscope className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="w-full">
      <div className={`rounded-lg border p-5 ${getAccentColor()} transition-all`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            {getIcon()}
          </div>
          <span className="font-semibold text-sm text-foreground">{summaryType || 'Assessment'}</span>
        </div>
        <div className="space-y-2 text-sm">{formatContent(summary)}</div>
      </div>
    </div>
  );
};

export default MedicalSummaryCard;
