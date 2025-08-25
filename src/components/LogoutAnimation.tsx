import { useEffect } from 'react';

interface LogoutAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function LogoutAnimation({ isVisible, onComplete }: LogoutAnimationProps) {
  useEffect(() => {
    if (isVisible) {
      // Complete animation after 800ms
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Main logout effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-destructive/30 via-orange-500/20 to-yellow-500/20 animate-[logoutDisappear_0.8s_cubic-bezier(0.4,0,1,1)]" />
      
      {/* Spiraling elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 bg-gradient-to-r from-primary to-destructive rounded-full animate-[logoutDisappear_0.8s_cubic-bezier(0.4,0,1,1)]"
              style={{
                transform: `rotate(${i * 60}deg) translateX(60px)`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Dispersing grid pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="grid grid-cols-12 grid-rows-8 h-full gap-1 p-4">
          {Array.from({ length: 96 }, (_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-muted to-primary/20 rounded-sm animate-[logoutDisappear_0.8s_cubic-bezier(0.4,0,1,1)]"
              style={{
                animationDelay: `${(i % 12) * 0.02 + Math.floor(i / 12) * 0.03}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Farewell message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-2xl font-bold text-foreground/80 animate-[logoutDisappear_0.8s_cubic-bezier(0.4,0,1,1)] animation-delay-200">
          ¡Hasta pronto!
        </div>
      </div>
    </div>
  );
}