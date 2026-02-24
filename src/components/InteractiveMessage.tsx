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
      <div className="space-y-4 px-4 py-3">
        <p className="text-sm font-medium text-foreground">{question}</p>
        {options.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {options.slice(0, 4).map((option) => (
              <Button
                key={option.id}
                variant={selectedOption === option.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => onOptionSelect && onOptionSelect(option)}
                disabled={!!selectedOption}
                className={`w-full text-left transition-all duration-200 text-xs font-medium py-2 min-h-[36px] whitespace-normal break-words rounded-xl press-scale
                  ${selectedOption === option.value
                    ? 'bg-primary/20 text-foreground border-primary/30 shadow-md'
                    : 'border-white/15 hover:bg-white/10 text-foreground/90 hover:text-foreground bg-transparent hover:border-white/25'
                  }`}
              >
                <span className="whitespace-normal break-words block text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
        )}
        {allowCustomAnswer && !selectedOption && options.length > 0 && (
          <div className="mt-3">
            {!showInput ? (
              <Button variant="outline" size="sm" className="text-xs text-muted-foreground border-white/15 hover:bg-white/10 rounded-xl press-scale" onClick={handleTypeOwnClick}>
                Type your own answer
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input type="text" value={customValue} onChange={e => setCustomValue(e.target.value)}
                  className="flex-1 rounded-xl px-3 py-2 text-xs sm:text-sm bg-secondary/50 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Type your answer..." onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); }} />
                <Button size="sm" onClick={handleCustomSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 text-xs sm:text-sm rounded-xl press-scale">Send</Button>
              </div>
            )}
          </div>
        )}
        {options.length === 0 && !selectedOption && (
          <div className="mt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={customValue} onChange={e => setCustomValue(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2 text-xs sm:text-sm bg-secondary/50 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Type your answer..." onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); }} />
              <Button size="sm" onClick={handleCustomSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 text-xs sm:text-sm rounded-xl press-scale">Send</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMessage;
