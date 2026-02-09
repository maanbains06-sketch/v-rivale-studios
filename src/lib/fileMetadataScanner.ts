import { supabase } from "@/integrations/supabase/client";

export interface ScanResult {
  isSuspicious: boolean;
  flags: string[];
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface FilesScanResult {
  overallSuspicious: boolean;
  highestRisk: 'low' | 'medium' | 'high' | 'critical';
  totalFlags: number;
  allFlags: string[];
  results: { url: string; result: ScanResult }[];
}

export interface FraudAlertPayload {
  submissionType: string;
  submissionId: string;
  submissionNumber?: string;
  discordId: string;
  discordUsername?: string;
  flags: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  fileUrls: string[];
  playerName?: string;
  playerId?: string;
  subject?: string;
}

/**
 * Scans files for metadata that indicates editing or manipulation
 */
export async function scanFilesForManipulation(
  fileUrls: string[],
  submissionType: string,
  submissionId: string,
  discordId: string,
  discordUsername?: string
): Promise<FilesScanResult | null> {
  if (!fileUrls || fileUrls.length === 0) {
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('scan-file-metadata', {
      body: {
        fileUrls,
        submissionType,
        submissionId,
        discordId,
        discordUsername
      }
    });

    if (error) {
      console.error('Error scanning files:', error);
      return null;
    }

    return data as FilesScanResult;
  } catch (error) {
    console.error('Error invoking scan-file-metadata:', error);
    return null;
  }
}

/**
 * Sends a fraud alert to Discord if suspicious files are detected
 */
export async function sendFraudAlertIfSuspicious(
  scanResult: FilesScanResult,
  alertPayload: FraudAlertPayload
): Promise<boolean> {
  // Only send alert for medium risk or higher
  if (!scanResult.overallSuspicious || scanResult.highestRisk === 'low') {
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-fraud-alert', {
      body: alertPayload
    });

    if (error) {
      console.error('Error sending fraud alert:', error);
      return false;
    }

    console.log('Fraud alert sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error invoking send-fraud-alert:', error);
    return false;
  }
}

/**
 * Complete scan and alert workflow
 */
export async function scanAndAlertForSuspiciousFiles(
  fileUrls: string[],
  submissionType: string,
  submissionId: string,
  submissionNumber: string | undefined,
  discordId: string,
  discordUsername?: string,
  additionalInfo?: {
    playerName?: string;
    playerId?: string;
    subject?: string;
  }
): Promise<{ scanned: boolean; suspicious: boolean; alertSent: boolean }> {
  const result = {
    scanned: false,
    suspicious: false,
    alertSent: false
  };

  // Scan files
  const scanResult = await scanFilesForManipulation(
    fileUrls,
    submissionType,
    submissionId,
    discordId,
    discordUsername
  );

  if (!scanResult) {
    return result;
  }

  result.scanned = true;
  result.suspicious = scanResult.overallSuspicious;

  // Send fraud alert if suspicious
  if (scanResult.overallSuspicious && scanResult.highestRisk !== 'low') {
    const alertPayload: FraudAlertPayload = {
      submissionType,
      submissionId,
      submissionNumber,
      discordId,
      discordUsername,
      flags: scanResult.allFlags,
      riskLevel: scanResult.highestRisk,
      fileUrls,
      ...additionalInfo
    };

    result.alertSent = await sendFraudAlertIfSuspicious(scanResult, alertPayload);
  }

  return result;
}
