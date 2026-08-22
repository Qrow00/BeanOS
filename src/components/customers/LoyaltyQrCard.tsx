import { useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Alert } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCodeLib from 'qrcode';

export interface LoyaltyQrCardHandle {
  sharePng: () => Promise<void>;
}

interface LoyaltyQrCardProps {
  code: string;
  nickname: string;
  storeName?: string;
}

const CARD_W = 600;
const CELL = 16;
const QR_MARGIN = 4;

function buildModules(value: string) {
  const qr = QRCodeLib.create(value, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const cells: { x: number; y: number }[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (data[row * size + col]) {
        cells.push({ x: col, y: row });
      }
    }
  }
  return { size, cells };
}

const LoyaltyQrCard = forwardRef<LoyaltyQrCardHandle, LoyaltyQrCardProps>(
  function LoyaltyQrCard({ code, nickname, storeName = 'Loyalty Card' }, ref) {
    const svgRef = useRef<Svg>(null);
    const { size, cells } = buildModules(code);

    // Fit the QR inside the card width, shrinking cells for longer codes
    const maxQrSize = CARD_W - 96;
    const cell = Math.min(CELL, Math.floor(maxQrSize / (size + QR_MARGIN * 2)));
    const qrSize = (size + QR_MARGIN * 2) * cell;
    const qrX = Math.round((CARD_W - qrSize) / 2);
    const qrY = 240;

    // Derive text positions + card height from the actual QR footprint
    const codeY = qrY + qrSize + 64;
    const footerY = codeY + 76;
    const CARD_H = Math.max(footerY + 48, 700);

    useImperativeHandle(ref, () => ({
      sharePng: async () => {
        try {
          if (!svgRef.current) return;
          const svg = svgRef.current as unknown as {
            toDataURL: (callback: (base64: string) => void, options?: object) => void;
          };
          const raw = await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('timeout')), 10000);
            svg.toDataURL(
              (base64: string) => {
                clearTimeout(timeout);
                resolve(base64);
              },
              { backgroundColor: '#FFFFFF', width: CARD_W, height: CARD_H }
            );
          });
          const base64 = raw.replace(/^data:image\/\w+;base64,/, '');
          const fileUri = `${FileSystem.cacheDirectory}loyalty-${code.replace(/[^A-Z0-9-]/gi, '')}.png`;
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (!(await Sharing.isAvailableAsync())) {
            Alert.alert('Saved', `QR image saved to:\n${fileUri}`);
            return;
          }
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: `${nickname}'s loyalty card`,
          });
        } catch {
          Alert.alert('Error', 'Could not export the QR image');
        }
      },
    }));

    return (
      <Svg ref={svgRef} width="100%" viewBox={`0 0 ${CARD_W} ${CARD_H}`} style={styles.card}>
        <Rect x={0} y={0} width={CARD_W} height={CARD_H} rx={36} fill="#FFFFFF" />
        <SvgText
          x={CARD_W / 2}
          y={90}
          fontSize={40}
          fontWeight="800"
          letterSpacing={6}
          textAnchor="middle"
          fill="#1C1917"
          opacity={0.55}
        >
          {storeName.toUpperCase()}
        </SvgText>
        <SvgText
          x={CARD_W / 2}
          y={170}
          fontSize={58}
          fontWeight="800"
          textAnchor="middle"
          fill="#D97706"
        >
          {nickname}
        </SvgText>
        <Rect
          x={qrX}
          y={qrY}
          width={qrSize}
          height={qrSize}
          rx={12}
          fill="#FFFFFF"
          stroke="#E7E5E4"
          strokeWidth={2}
        />
        {cells.map((c, i) => (
          <Rect
            key={i}
            x={qrX + (c.x + QR_MARGIN) * cell}
            y={qrY + (c.y + QR_MARGIN) * cell}
            width={cell}
            height={cell}
            fill="#1C1917"
          />
        ))}
        <SvgText
          x={CARD_W / 2}
          y={codeY}
          fontSize={34}
          fontWeight="700"
          letterSpacing={3}
          textAnchor="middle"
          fill="#1C1917"
        >
          {code}
        </SvgText>
        <SvgText
          x={CARD_W / 2}
          y={footerY}
          fontSize={26}
          fontWeight="600"
          letterSpacing={2}
          textAnchor="middle"
          fill="#78716C"
        >
          Scan at checkout to earn points
        </SvgText>
      </Svg>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
});

export default LoyaltyQrCard;
