declare module '*.png' {
  const source: number;
  export default source;
}

declare module '*.jpg' {
  const source: number;
  export default source;
}

declare module '*.jpeg' {
  const source: number;
  export default source;
}

declare module 'qrcode' {
  interface QrModules {
    size: number;
    data: Uint8Array | number[];
  }
  interface QrCreated {
    modules: QrModules;
  }
  export function create(text: string, options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }): QrCreated;
}
