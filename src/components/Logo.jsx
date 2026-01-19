const Logo = ({ size = 'md', variant = 'full' }) => {
  const sizes = {
    sm: { container: 'w-12 h-12', text: 'text-xs' },
    md: { container: 'w-16 h-16', text: 'text-sm' },
    lg: { container: 'w-24 h-24', text: 'text-base' },
    xl: { container: 'w-32 h-32', text: 'text-lg' }
  };

  // Dashboard tile logo (purple + gold)
  if (variant === 'tile') {
    return (
      <div className={`${sizes[size].container} relative flex items-center justify-center`}>
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-purple to-purple-900 rounded-2xl shadow-lg" />
        <div className="absolute inset-0.5 bg-gradient-to-br from-luxury-purple/90 to-purple-800 rounded-2xl" />
        <div className="relative z-10 text-center">
          <div className="font-serif font-bold text-luxury-gold text-xl leading-none">JS</div>
          <div className="text-luxury-gold/80 text-[8px] font-medium tracking-wider mt-0.5">JEWELLERY</div>
        </div>
        {/* Sparkles */}
        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-luxury-gold rounded-full animate-pulse" />
        <div className="absolute bottom-2 left-1.5 w-1 h-1 bg-luxury-gold/70 rounded-full animate-pulse delay-100" />
      </div>
    );
  }

  // Full luxury logo for PDF
  if (variant === 'full') {
    return (
      <div className="text-center">
        <div className="inline-block relative">
          {/* Decorative elements */}
          <div className="absolute -top-2 -left-4 w-3 h-3 border-t-2 border-l-2 border-luxury-gold" />
          <div className="absolute -top-2 -right-4 w-3 h-3 border-t-2 border-r-2 border-luxury-gold" />
          <div className="absolute -bottom-2 -left-4 w-3 h-3 border-b-2 border-l-2 border-luxury-gold" />
          <div className="absolute -bottom-2 -right-4 w-3 h-3 border-b-2 border-r-2 border-luxury-gold" />
          
          {/* Main text */}
          <div className="px-6 py-2">
            <h1 className="font-serif text-3xl font-bold text-luxury-purple tracking-wide">
              JS Fashion
            </h1>
            <div className="flex items-center gap-2 justify-center mt-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-luxury-gold to-transparent" />
              <span className="text-luxury-gold text-xs tracking-[0.3em] font-medium">
                JEWELLERY
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-luxury-gold to-transparent" />
            </div>
          </div>
          
          {/* Sparkles */}
          <div className="absolute -top-1 left-1/4 text-luxury-gold text-xs">✦</div>
          <div className="absolute -top-1 right-1/4 text-luxury-gold text-xs">✦</div>
        </div>
      </div>
    );
  }

  return null;
};

export default Logo;
