import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- Add this utility function ---
function uint8ToBase64(u8Arr) {
  var CHUNK_SIZE = 0x8000;
  var index = 0;
  var length = u8Arr.length;
  var result = '';
  var slice;
  while (index < length) {
    slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
    result += String.fromCharCode.apply(null, slice);
    index += CHUNK_SIZE;
  }
  return btoa(result);
}
// ---

export default function RideDetail() {
  const { date, pickup, drop, fare } = useLocalSearchParams();
  const cleanFare = String(fare ?? '').replace(/₹/g, '').trim();
  const router = useRouter();

  const handleDownloadPDFInvoice = async () => {
  try {
    // Load logo
    const logoAsset = Asset.fromModule(require('../assets/images/logo.jpg'));
    await logoAsset.downloadAsync();
    const logoBase64 = await FileSystem.readAsStringAsync(logoAsset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 400;
    const pageHeight = 600;
    const topMargin =80;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Colors
    const yellow = rgb(1, 0.84, 0);
    const black = rgb(0, 0, 0);

    // Embed and scale logo
    const logoImage = await pdfDoc.embedJpg(logoBase64);

    // Set desired logo width (e.g., 120pt or pageWidth minus margin)
    const logoTargetWidth = 120;
    const logoScale = logoTargetWidth / logoImage.width;
    const logoWidth = logoImage.width * logoScale;
    const logoHeight = logoImage.height * logoScale;
    const logoY = pageHeight - logoHeight - topMargin;
    let currentY = logoY - 20;

    // Draw logo at the top center
    page.drawImage(logoImage, {
      x: (pageWidth - logoWidth) / 2,
      y: logoY,
      width: logoWidth,
      height: logoHeight,
    });

    // Header
    page.drawText('NexRide', {
      x: 30,
      y: currentY,
      size: 22,
      font: font,
      color: yellow,
    });

    currentY -= 20;
    page.drawText('Ride Invoice', {
      x: 30,
      y: currentY,
      size: 16,
      font: font,
      color: black,
    });

    currentY -= 10;
    page.drawLine({
      start: { x: 30, y: currentY },
      end: { x: 370, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Ride Details
    currentY -= 30;
    const lineGap = 30;
    const details = [
      { label: 'Date', value: String(date ?? '') },
      { label: 'Pickup', value: String(pickup ?? '') },
      { label: 'Drop', value: String(drop ?? '') },
      { label: 'Fare', value: `${cleanFare}` },
      { label: 'Payment Method', value: 'Online' },
    ];

    details.forEach((item, idx) => {
      const y = currentY - idx * lineGap;
      page.drawText(`${item.label}:`, {
        x: 30,
        y,
        size: 13,
        font: font,
        color: black,
      });
      page.drawText(String(item.value), {
        x: 150,
        y,
        size: 13,
        font: font,
        color: black,
      });
    });

    // Draw line before footer
    const footerY = currentY - details.length * lineGap - 10;
    page.drawLine({
      start: { x: 30, y: footerY },
      end: { x: 370, y: footerY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Footer
    page.drawText('Thank you for riding with NexRide!', {
      x: 30,
      y: footerY - 20,
      size: 12,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Save and share
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = uint8ToBase64(pdfBytes);
    const pdfUri = FileSystem.documentDirectory + 'NexRide_Invoice.pdf';

    await FileSystem.writeAsStringAsync(pdfUri, pdfBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share your ride invoice',
    });
  } catch (error) {
    Alert.alert('Error', 'Could not generate invoice.');
    console.error(error);
  }
};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Details</Text>

      <Text style={styles.label}>Date:</Text>
      <Text style={styles.value}>{date}</Text>

      <Text style={styles.label}>Pickup:</Text>
      <Text style={styles.value}>{pickup}</Text>

      <Text style={styles.label}>Drop:</Text>
      <Text style={styles.value}>{drop}</Text>

      <Text style={styles.label}>Fare:</Text>
      <Text style={styles.value}>{cleanFare}</Text>

      <TouchableOpacity style={styles.invoiceButton} onPress={handleDownloadPDFInvoice}>
        <Text style={styles.backText}>Download Invoice (PDF)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    alignSelf: 'center',
  },
  label: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  invoiceButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#2c2c2e',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  backText: {
    color: 'black',
    fontWeight: 'bold',
  },
});
