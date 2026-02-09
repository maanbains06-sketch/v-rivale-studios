import { supabase } from "@/integrations/supabase/client";

export interface ScanResult {
  isSuspicious: boolean;
  flags: string[];
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'manipulation' | 'inappropriate' | 'language' | 'fake' | 'clean';
}

export interface FileResult {
  url: string;
  result: ScanResult;
}

export interface FilesScanResult {
  overallSuspicious: boolean;
  highestRisk: 'low' | 'medium' | 'high' | 'critical';
  primaryCategory: 'manipulation' | 'inappropriate' | 'language' | 'fake' | 'clean';
  totalFlags: number;
  allFlags: string[];
  results: FileResult[];
}

export interface FraudAlertPayload {
  submissionType: string;
  submissionId: string;
  submissionNumber?: string;
  discordId: string;
  discordUsername?: string;
  flags: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryCategory?: 'manipulation' | 'inappropriate' | 'language' | 'fake' | 'clean';
  fileUrls: string[];
  fileResults?: FileResult[];
  playerName?: string;
  playerId?: string;
  subject?: string;
  messagePreview?: string;
}

/**
 * Scans files and text content for metadata that indicates editing, manipulation,
 * inappropriate content, or bad language
 */
export async function scanFilesForManipulation(
  fileUrls: string[],
  submissionType: string,
  submissionId: string,
  discordId: string,
  discordUsername?: string,
  textContent?: string
): Promise<FilesScanResult | null> {
  // Allow scanning even without files if text content is provided
  if ((!fileUrls || fileUrls.length === 0) && !textContent) {
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('scan-file-metadata', {
      body: {
        fileUrls: fileUrls || [],
        submissionType,
        submissionId,
        discordId,
        discordUsername,
        textContent
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
 * Sends a fraud alert to Discord if suspicious files or content are detected
 * Now includes detailed file results for proof
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
    // Include the primary category and file results for detailed proof
    const payloadWithProof: FraudAlertPayload = {
      ...alertPayload,
      primaryCategory: scanResult.primaryCategory,
      fileResults: scanResult.results // Include detailed file analysis results
    };

    const { data, error } = await supabase.functions.invoke('send-fraud-alert', {
      body: payloadWithProof
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
 * Complete scan and alert workflow for files and text content
 * Now passes detailed file results for comprehensive proof
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
    messagePreview?: string;
    textContent?: string;
  }
): Promise<{ scanned: boolean; suspicious: boolean; alertSent: boolean }> {
  const result = {
    scanned: false,
    suspicious: false,
    alertSent: false
  };

  // Scan files and text content
  const scanResult = await scanFilesForManipulation(
    fileUrls,
    submissionType,
    submissionId,
    discordId,
    discordUsername,
    additionalInfo?.textContent
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
      primaryCategory: scanResult.primaryCategory,
      fileUrls,
      fileResults: scanResult.results, // Include detailed results for proof
      playerName: additionalInfo?.playerName,
      playerId: additionalInfo?.playerId,
      subject: additionalInfo?.subject,
      messagePreview: additionalInfo?.messagePreview
    };

    result.alertSent = await sendFraudAlertIfSuspicious(scanResult, alertPayload);
  }

  return result;
}

/**
 * Quick scan for text content only (no files)
 * Useful for checking messages before submission
 */
export async function scanTextForViolations(
  textContent: string,
  submissionType: string,
  submissionId: string,
  discordId: string,
  discordUsername?: string
): Promise<FilesScanResult | null> {
  return scanFilesForManipulation(
    [],
    submissionType,
    submissionId,
    discordId,
    discordUsername,
    textContent
  );
}
