const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-4 py-4 px-2 animate-fade-in">
      <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center border border-primary/20 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      <span className="text-sm text-muted-foreground/80 font-medium">Analyzing your symptoms...</span>
    </div>
  );
};

export default TypingIndicator;
