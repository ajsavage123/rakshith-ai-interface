import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InteractiveOption {
  id: string;
  label: string;
  value: string;
}

interface InteractiveMessageProps {
  question: string;
  options?: InteractiveOption[];
  onOptionSelect?: (option: InteractiveOption) => void;
  selectedOption?: string;
  allowCustomAnswer?: boolean;
  onCustomAnswer?: (answer: string) => void;
  onFocusMainInput?: () => void;
}

const InteractiveMessage = ({ question, options = [], onOptionSelect, selectedOption, allowCustomAnswer = false, onCustomAnswer, onFocusMainInput }: InteractiveMessageProps) => {
  const [showInput, setShowInput] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleCustomSubmit = () => {
    if (customValue.trim() && onCustomAnswer) {
      onCustomAnswer(customValue.trim());
      setCustomValue("");
      setShowInput(false);
    }
  };

  const handleTypeOwnClick = () => {
    if (onFocusMainInput) onFocusMainInput();
    else setShowInput(true);
  };

  return (
    <div className="max-w-[70vw] sm:max-w-sm lg:max-w-sm w-full">
      <div className="space-y-5 px-1 py-1">
        <p className="text-sm font-semibold text-foreground leading-tight">{question}</p>
        {options.length > 0 && (
          <div className="flex flex-col gap-3 w-full">
            {options.slice(0, 4).map((option) => (
              <button
                key={option.id}
                onClick={() => onOptionSelect && onOptionSelect(option)}
                disabled={!!selectedOption}
                className={`w-full text-left transition-all duration-300 text-sm font-medium px-5 py-3.5 min-h-[44px] whitespace-normal break-words rounded-xl press-scale border
                  ${selectedOption === option.value
                    ? 'bg-gradient-to-r from-primary/25 to-primary/15 text-foreground border-primary/40 shadow-lg shadow-primary/10'
                    : 'border-white/12 bg-white/3 text-foreground/85 hover:text-foreground hover:bg-white/6 hover:border-primary/20'
                  }
                  disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <span className="whitespace-normal break-words block text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        )}
        {allowCustomAnswer && !selectedOption && options.length > 0 && (
          <div className="mt-4 pt-2 border-t border-white/5">
            {!showInput ? (
              <button 
                onClick={handleTypeOwnClick}
                className="text-xs text-primary/80 hover:text-primary font-medium transition-colors duration-200 mt-3"
              >
                + Type your own answer
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <input type="text" value={customValue} onChange={e => setCustomValue(e.target.value)}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm bg-secondary/40 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all duration-200"
                  placeholder="Type your answer..." onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); }} />
                <Button size="sm" onClick={handleCustomSubmit} className="bg-primary hover:bg-primary/95 text-primary-foreground px-5 text-sm rounded-lg press-scale font-medium transition-all duration-200">Send</Button>
              </div>
            )}
          </div>
        )}
        {options.length === 0 && !selectedOption && (
          <div className="mt-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={customValue} onChange={e => setCustomValue(e.target.value)}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm bg-secondary/40 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all duration-200"
                placeholder="Type your answer..." onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); }} />
              <Button size="sm" onClick={handleCustomSubmit} className="bg-primary hover:bg-primary/95 text-primary-foreground px-5 text-sm rounded-lg press-scale font-medium transition-all duration-200">Send</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMessage;
