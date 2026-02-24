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
      {/* Ambient glows */}
      <div className="ambient-glow w-80 h-80 bg-primary -top-40 -right-40 animate-float" />
      <div className="ambient-glow w-80 h-80 bg-primary -bottom-40 -left-40 animate-float animation-delay-300" />

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center">
        <img src={rakshithLogo} alt="Rakshith 360 Logo" className="mx-auto mb-6 sm:mb-8" style={{ width: '140px', height: '140px', objectFit: 'contain' }} />

        <div className="flex justify-center mb-6">
          <div className="flex space-x-3">
            {steps.map((_, index) => (
              <div key={index} className={`h-2 rounded-full transition-all duration-500 ${index === currentStep ? 'bg-primary w-8' : index < currentStep ? 'bg-primary/60 w-3' : 'bg-white/20 w-3'}`} />
            ))}
          </div>
        </div>

        <div className="mb-8 space-y-4 w-full px-2">
          <div className="mx-auto mb-4">{currentStepData.icon}</div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{currentStepData.title}</h1>
          <p className="text-lg sm:text-xl font-semibold text-primary">{currentStepData.subtitle}</p>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">{currentStepData.content}</p>
        </div>

        <Button className="w-full max-w-xs py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg press-scale" onClick={handleNext}>
          {currentStep < steps.length - 1 ? 'Next →' : 'Get Started →'}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
