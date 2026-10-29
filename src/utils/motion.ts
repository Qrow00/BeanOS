export interface SpringMotion {
  stiffness: number;
  damping: number;
  mass: number;
}

export const springs = {
  expressive: { stiffness: 320, damping: 20, mass: 0.7 } as SpringMotion,
  bouncy: { stiffness: 260, damping: 15, mass: 0.8 } as SpringMotion,
  gentle: { stiffness: 180, damping: 22, mass: 1 } as SpringMotion,
  press: { stiffness: 420, damping: 24, mass: 0.6 } as SpringMotion,
  release: { stiffness: 300, damping: 14, mass: 0.7 } as SpringMotion,
};

export const elasticScroll = {
  overScrollMode: 'always' as const,
  bounces: true,
  alwaysBounceVertical: true,
};

