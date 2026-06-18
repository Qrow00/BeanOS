import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getAllProducts, createProduct, updateProduct, getProductByItemId } from '../database/products';

export async function exportToExcel(db: SQLiteDatabase): Promise<string> {
  const products = await getAllProducts(db);

  const data = products.map(p => ({
    'Item ID': p.item_id,
    'Name': p.name,
    'Category': p.category,
    'Price': p.price,
    'Stock Quantity': p.stock_quantity,
    'Barcode': p.barcode || '',
    'Description': p.description || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  const fileName = `Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
  const fileUri = FileSystem.documentDirectory + fileName;
  await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  return fileUri;
}

export async function importFromExcel(db: SQLiteDatabase): Promise<{ added: number; updated: number }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/comma-separated-values',
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return { added: 0, updated: 0 };

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const wb = XLSX.read(content, { type: 'base64' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

  let added = 0;
  let updated = 0;

  for (const row of rows) {
    const itemId = String(row['Item ID'] || row['item_id'] || '');
    const name = String(row['Name'] || row['name'] || '');
    if (!itemId || !name) continue;

    const existing = await getProductByItemId(db, itemId);

    const productData = {
      item_id: itemId,
      name,
      category: String(row['Category'] || row['category'] || 'General'),
      price: parseFloat(row['Price'] || row['price'] || '0'),
      stock_quantity: parseInt(row['Stock Quantity'] || row['stock_quantity'] || '0', 10),
      stock_unit: row['Stock Unit'] || row['stock_unit'] || 'pcs',
      barcode: row['Barcode'] || row['barcode'] || null,
      description: row['Description'] || row['description'] || null,
      image_uri: null,
    };

    if (existing) {
      await updateProduct(db, existing.id, productData);
      updated++;
    } else {
      await createProduct(db, productData);
      added++;
    }
  }

  return { added, updated };
}
