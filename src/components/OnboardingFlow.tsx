import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Shield, Clock } from "lucide-react";
import rakshithLogo from '../assets/rakshith360-logo.png';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Welcome to Rakshith AI", subtitle: "Your intelligent medical assistant", content: "Get instant medical guidance, symptom assessment, and professional healthcare recommendations 24/7.", icon: <Sparkles className="w-16 h-16 text-primary" /> },
    { title: "Secure & Confidential", subtitle: "Your privacy is our priority", content: "All your medical conversations are encrypted and kept completely confidential. We follow strict medical privacy standards.", icon: <Shield className="w-16 h-16 text-success" /> },
    { title: "24/7 Availability", subtitle: "Always here when you need us", content: "Access medical guidance anytime, anywhere. Get immediate responses for your health concerns, day or night.", icon: <Clock className="w-16 h-16 text-primary" /> }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle ambient glows */}
      <div className="ambient-glow w-72 h-72 bg-primary/30 -top-32 -right-32 animate-float" />
      <div className="ambient-glow w-64 h-64 bg-primary/20 -bottom-32 -left-32 animate-float animation-delay-300" />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center flex flex-col items-center">
        <div className="mb-8 sm:mb-10 w-24 h-24 rounded-2xl flex items-center justify-center border border-primary/30 bg-gradient-to-br from-primary/25 to-primary/10 shadow-lg shadow-primary/10">
          <img src={rakshithLogo} alt="Rakshith 360" className="w-14 h-14" />
        </div>

        <div className="flex justify-center mb-10">
          <div className="flex gap-2.5">
            {steps.map((_, index) => (
              <div key={index} className={`rounded-full transition-all duration-500 ${index === currentStep ? 'bg-primary/80 h-2.5 w-10' : index < currentStep ? 'bg-primary/40 h-2 w-2' : 'bg-white/15 h-2 w-2'}`} />
            ))}
          </div>
        </div>

        <div className="mb-10 space-y-6 w-full px-4">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/8">
            {currentStepData.icon}
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight text-balance">{currentStepData.title}</h1>
            <p className="text-lg font-semibold text-primary/90">{currentStepData.subtitle}</p>
            <p className="text-base text-muted-foreground/80 max-w-md mx-auto leading-relaxed">{currentStepData.content}</p>
          </div>
        </div>

        <Button onClick={handleNext} className="w-full max-w-xs py-3.5 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-primary-foreground font-semibold text-base press-scale shadow-lg shadow-primary/20 transition-all duration-200">
          {currentStep < steps.length - 1 ? 'Next →' : 'Get Started →'}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
