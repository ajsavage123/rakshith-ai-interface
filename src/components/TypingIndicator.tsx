const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 p-3">
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      <span className="text-sm text-muted-foreground italic">AI is analyzing...</span>
    </div>
  );
};

export default TypingIndicator;
