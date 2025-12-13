/**
 * 🎉 Sistema de Celebrações Premium
 * Microinterações que encantam usuários
 */

import confetti from 'canvas-confetti';

// ============================================
// 🎊 CONFETTI ANIMATIONS
// ============================================

/**
 * Celebração de venda concluída
 */
export const celebrateSale = (amount: number) => {
  const duration = amount > 5000 ? 5000 : 3000;
  const particleCount = amount > 5000 ? 200 : amount > 1000 ? 150 : 100;
  
  // Explosão principal
  confetti({
    particleCount,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    ticks: 200,
    gravity: 1.2,
    scalar: 1.2,
  });

  // Explosão secundária (para vendas grandes)
  if (amount > 1000) {
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
      });
    }, 200);
  }

  // Chuva de estrelas (para vendas VIP > R$ 5.000)
  if (amount > 5000) {
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
};

/**
 * Celebração de meta atingida
 */
export const celebrateGoal = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
    });
  }, 250);
};

/**
 * Celebração de novo cliente VIP
 */
export const celebrateVIPClient = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#FFD700', '#FFA500', '#FF8C00'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#ec4899', '#f472b6', '#f9a8d4'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#10b981', '#34d399', '#6ee7b7'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
  });
};

/**
 * Celebração simples (ação completada)
 */
export const celebrateSuccess = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#34d399', '#6ee7b7'],
  });
};

// ============================================
// 🔊 SOUND EFFECTS
// ============================================

/**
 * Toca som de sucesso
 */
export const playSuccessSound = () => {
  const audio = new Audio('/sounds/success.mp3');
  audio.volume = 0.3;
  audio.play().catch(() => {
    // Silently fail if sound can't play
  });
};

/**
 * Toca som de caixa registradora
 */
export const playCashRegisterSound = () => {
  const audio = new Audio('/sounds/cash-register.mp3');
  audio.volume = 0.4;
  audio.play().catch(() => {
    // Silently fail if sound can't play
  });
};

/**
 * Toca som de notificação
 */
export const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3');
  audio.volume = 0.2;
  audio.play().catch(() => {
    // Silently fail if sound can't play
  });
};

// ============================================
// ✨ HAPTIC FEEDBACK (Mobile)
// ============================================

/**
 * Vibração de sucesso (mobile)
 */
export const hapticSuccess = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50]);
  }
};

/**
 * Vibração de erro (mobile)
 */
export const hapticError = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100, 50, 100]);
  }
};

/**
 * Vibração leve (feedback de toque)
 */
export const hapticLight = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

// ============================================
// 🎯 COMBINAÇÕES PREMIUM
// ============================================

/**
 * Celebração completa de venda (confetti + som + haptic)
 */
export const celebrateCompleteSale = (amount: number) => {
  celebrateSale(amount);
  playCashRegisterSound();
  hapticSuccess();
};

/**
 * Celebração de conquista (badge desbloqueado)
 */
export const celebrateAchievement = (achievementName: string) => {
  celebrateSuccess();
  playSuccessSound();
  hapticSuccess();
  
  // Toast notification será adicionado pelo componente que chama
  console.log(`🏆 Conquista desbloqueada: ${achievementName}`);
};

/**
 * Feedback de ação bem-sucedida
 */
export const feedbackSuccess = () => {
  playSuccessSound();
  hapticLight();
};

/**
 * Feedback de erro
 */
export const feedbackError = () => {
  hapticError();
};
