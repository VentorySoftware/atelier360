import { useEffect, useState } from 'react';

interface LoginAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function LoginAnimation({ isVisible, onComplete }: LoginAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; x: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate random particles
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2,
        x: Math.random() * 100
      }));
      setParticles(newParticles);

      // Complete animation after 1.2s
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 animate-[loginAppear_1.2s_cubic-bezier(0.4,0,0.2,1)]" />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-primary rounded-full animate-[particleFloat_4s_linear_infinite]"
          style={{
            left: `${particle.x}%`,
            animationDelay: `${particle.delay}s`,
            boxShadow: '0 0 10px hsl(var(--primary) / 0.6)'
          }}
        />
      ))}

      {/* Central glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-gradient-radial from-primary/30 via-secondary/20 to-transparent rounded-full animate-[welcomePulse_3s_ease-in-out_infinite] blur-3xl" />
      </div>

      {/* Shimmer lines */}
      <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmerGlow_2s_linear_infinite]" />
      <div className="absolute bottom-1/4 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent animate-[shimmerGlow_2s_linear_infinite] animation-delay-1000" />
    </div>
  );
}