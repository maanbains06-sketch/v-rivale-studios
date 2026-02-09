import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanResult {
  isSuspicious: boolean;
  flags: string[];
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'manipulation' | 'inappropriate' | 'language' | 'fake' | 'clean';
}

interface ContentScanResult {
  hasInappropriateContent: boolean;
  hasBadLanguage: boolean;
  flags: string[];
  details: Record<string, any>;
}

// Known editing software signatures in EXIF data
const EDITING_SOFTWARE = [
  'photoshop', 'gimp', 'lightroom', 'snapseed', 'picsart', 'canva',
  'pixlr', 'fotor', 'befunky', 'paint.net', 'affinity', 'capture one',
  'luminar', 'darktable', 'rawtherapee', 'photo editor', 'image editor',
  'adobe', 'corel', 'paintshop', 'acdsee', 'photoscape', 'picmonkey',
  'fotoflexer', 'ipiccy', 'ribbet', 'sumopaint', 'polarr', 'vsco',
  'afterlight', 'enlight', 'mextures', 'facetune', 'airbrush', 'retouch',
  'remove.bg', 'photoroom', 'background eraser', 'cut out', 'remove object',
  'inshot', 'kinemaster', 'capcut', 'vn editor', 'videoleap', 'splice'
];

// Suspicious video encoder patterns
const SUSPICIOUS_ENCODERS = [
  'obs', 'bandicam', 'camtasia', 'screen recorder', 'screencast',
  'nvidia share', 'shadowplay', 'relive', 'plays.tv', 'medal.tv',
  'fraps', 'dxtory', 'action!', 'xsplit', 'mirillis', 'wondershare',
  'filmora', 'movavi', 'davinci', 'premiere', 'final cut', 'vegas',
  'handbrake', 'ffmpeg', 'avidemux', 'virtualdub', 'shotcut', 'kdenlive',
  'openshot', 'hitfilm', 'blender', 'after effects', 'motion', 'nuke'
];

// Re-encoding indicators
const REENCODING_SIGNS = [
  'libx264', 'libx265', 'x264', 'x265', 'hevc', 'avc1',
  'lavf', 'lavc', 'matroska', 'webm', 'mp4box', 'gpac'
];

// Bad language patterns (Hindi + English profanity)
const BAD_LANGUAGE_PATTERNS = [
  // English profanity
  /\b(fuck|fucking|fucked|fucker|fck|f\*ck|f\*\*k)\b/gi,
  /\b(shit|shitting|bullshit|sh\*t|s\*\*t)\b/gi,
  /\b(bitch|bitches|b\*tch)\b/gi,
  /\b(ass|asshole|a\*\*hole|arse)\b/gi,
  /\b(damn|dammit|goddamn)\b/gi,
  /\b(bastard|b\*stard)\b/gi,
  /\b(dick|d\*ck|penis|cock|c\*ck)\b/gi,
  /\b(pussy|p\*ssy|vagina)\b/gi,
  /\b(cunt|c\*nt)\b/gi,
  /\b(nigger|n\*gger|nigga)\b/gi,
  /\b(retard|retarded)\b/gi,
  /\b(whore|wh\*re|slut|sl\*t)\b/gi,
  // Hindi profanity (transliterated)
  /\b(bhenchod|bhen\s*chod|bc|b\.c\.|bhenchod)\b/gi,
  /\b(madarchod|mader\s*chod|mc|m\.c\.)\b/gi,
  /\b(chutiya|chutiye|chu\*iya|c\*utiya)\b/gi,
  /\b(gaand|gand|g\*nd)\b/gi,
  /\b(lund|l\*nd|lauda|l\*uda)\b/gi,
  /\b(randi|r\*ndi|raand)\b/gi,
  /\b(bhosdike|bh\*sdike|bsdk)\b/gi,
  /\b(harami|haramkhor)\b/gi,
  /\b(kutte|kutta|kamina|kamini)\b/gi,
  /\b(saala|saale|sala)\b/gi,
  /\b(ullu|gadha|bewakoof)\b/gi,
];

// 18+ / Inappropriate content patterns
const INAPPROPRIATE_PATTERNS = [
  // Sexual content
  /\b(sex|sexual|sexy|sexx|s3x)\b/gi,
  /\b(porn|porno|pornography|p\*rn)\b/gi,
  /\b(nude|nudes|naked|n\*de)\b/gi,
  /\b(boobs|breasts|tits|t\*ts)\b/gi,
  /\b(xxx|xxxx|18\+|adult\s*content)\b/gi,
  /\b(onlyfans|of\s*content|leaked\s*content)\b/gi,
  /\b(horny|h\*rny|aroused)\b/gi,
  /\b(masturbat|masturb|fap|jerk\s*off)\b/gi,
  /\b(orgasm|cum|cumming|c\*m)\b/gi,
  // Violence/threats
  /\b(kill\s*you|murder|i\'ll\s*kill|gonna\s*kill)\b/gi,
  /\b(rape|r\*pe|raping)\b/gi,
  /\b(suicide|kill\s*myself|end\s*my\s*life)\b/gi,
  /\b(bomb|bombing|terrorist|terrorism)\b/gi,
  // Drug references
  /\b(cocaine|heroin|meth|drugs|weed|marijuana|ganja)\b/gi,
  // Scam/fraud indicators
  /\b(free\s*money|easy\s*money|get\s*rich\s*quick)\b/gi,
  /\b(hack|hacking|cheat|cheating|exploit)\b/gi,
];

// Fake evidence indicators in text
const FAKE_EVIDENCE_PATTERNS = [
  /\b(inspect\s*element|edited|photoshopped|fake|fabricated)\b/gi,
  /\b(generated|ai\s*generated|deepfake|manipulated)\b/gi,
  /\b(false\s*evidence|made\s*up|not\s*real)\b/gi,
];

function scanTextContent(text: string): ContentScanResult {
  const flags: string[] = [];
  const details: Record<string, any> = {};
  let hasInappropriateContent = false;
  let hasBadLanguage = false;

  if (!text || text.trim().length === 0) {
    return { hasInappropriateContent: false, hasBadLanguage: false, flags: [], details: {} };
  }

  const lowerText = text.toLowerCase();

  // Check for bad language
  for (const pattern of BAD_LANGUAGE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      hasBadLanguage = true;
      const uniqueMatches = [...new Set(matches.map(m => m.toLowerCase()))];
      flags.push(`🚫 PROFANITY DETECTED: Contains offensive language (${uniqueMatches.length} instance${uniqueMatches.length > 1 ? 's' : ''})`);
      details.profanityFound = uniqueMatches;
      break; // One flag is enough
    }
  }

  // Check for inappropriate/18+ content
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      hasInappropriateContent = true;
      const category = pattern.source.includes('sex|porn|nude') ? 'Sexual Content' :
                       pattern.source.includes('kill|murder|rape') ? 'Violence/Threats' :
                       pattern.source.includes('cocaine|heroin|drugs') ? 'Drug References' :
                       pattern.source.includes('hack|cheat|exploit') ? 'Fraud/Cheating' : 'Inappropriate Content';
      flags.push(`🔞 18+ CONTENT: ${category} detected in submission`);
      details.inappropriateCategory = category;
      break;
    }
  }

  // Check for fake evidence indicators in text
  for (const pattern of FAKE_EVIDENCE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      flags.push(`⚠️ SUSPICIOUS TEXT: User may have mentioned editing/faking evidence`);
      details.suspiciousTextFound = true;
      break;
    }
  }

  return { hasInappropriateContent, hasBadLanguage, flags, details };
}

async function analyzeImageMetadata(fileUrl: string): Promise<ScanResult> {
  const flags: string[] = [];
  const details: Record<string, any> = {};
  let category: ScanResult['category'] = 'clean';
  
  try {
    // Fetch file headers to check content type
    const response = await fetch(fileUrl, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0');
    
    details.contentType = contentType;
    details.fileSize = contentLength;
    
    // Check for very small file sizes (potential cropped/edited)
    if (contentLength < 10000 && contentType.includes('image')) {
      flags.push('📐 CROPPED IMAGE: Unusually small file size indicates heavy cropping or compression');
      category = 'manipulation';
    }
    
    // Fetch actual file for deeper analysis
    const fileResponse = await fetch(fileUrl);
    const arrayBuffer = await fileResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Check for EXIF data markers
    const fileContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, Math.min(bytes.length, 65536)));
    const fileContentLower = fileContent.toLowerCase();
    
    // Check for editing software signatures
    for (const software of EDITING_SOFTWARE) {
      if (fileContentLower.includes(software)) {
        const softwareName = software.charAt(0).toUpperCase() + software.slice(1);
        flags.push(`🖌️ EDITED IMAGE: File was modified using ${softwareName}`);
        details.editingSoftware = software;
        category = 'manipulation';
        break;
      }
    }
    
    // Check for modification timestamps in metadata
    if (fileContentLower.includes('modifydate') || fileContentLower.includes('modify date')) {
      flags.push('📝 MODIFIED: File contains modification timestamp - image was altered after creation');
      category = 'manipulation';
    }
    
    // Check for history/undo data (Photoshop specific)
    if (fileContentLower.includes('photoshop') && fileContentLower.includes('history')) {
      flags.push('🎨 PHOTOSHOP HISTORY: Multiple edit operations detected - extensive manipulation');
      category = 'manipulation';
    }
    
    // Check for layer data (indicates composite image)
    if (fileContentLower.includes('layer') && (fileContentLower.includes('composite') || fileContentLower.includes('merged'))) {
      flags.push('📑 COMPOSITE IMAGE: Created by merging multiple image sources');
      category = 'fake';
    }
    
    // Check for clone/heal tool markers
    if (fileContentLower.includes('heal') || fileContentLower.includes('clone') || fileContentLower.includes('spot')) {
      flags.push('🩹 HEALING TOOL: Parts of the image were digitally removed or altered');
      category = 'manipulation';
    }
    
    // Check PNG for text chunks that indicate editing
    if (contentType.includes('png')) {
      if (fileContentLower.includes('software') || fileContentLower.includes('creator')) {
        const softwareMatch = fileContentLower.match(/software[:\s]+([a-z0-9\s.]+)/i);
        if (softwareMatch) {
          for (const editSoft of EDITING_SOFTWARE) {
            if (softwareMatch[1].toLowerCase().includes(editSoft)) {
              flags.push(`🖼️ PNG EDITED: Image created/modified with ${editSoft.toUpperCase()}`);
              category = 'manipulation';
              break;
            }
          }
        }
      }
    }
    
    // Check for screenshot indicators that might be manipulated
    if (fileContentLower.includes('screenshot') && flags.length > 0) {
      flags.push('📱 FAKE SCREENSHOT: Screenshot shows signs of post-capture manipulation');
      category = 'fake';
    }
    
    // Analyze JPEG quality markers for re-saving
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      // Multiple JFIF markers indicate re-saving
      const jfifCount = (fileContent.match(/JFIF/g) || []).length;
      if (jfifCount > 1) {
        flags.push('💾 RE-SAVED: Image was saved multiple times - possible content alteration between saves');
        category = 'manipulation';
      }
    }
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    details.analysisError = String(error);
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (flags.length >= 4) {
    riskLevel = 'critical';
  } else if (flags.length >= 3) {
    riskLevel = 'high';
  } else if (flags.length >= 2) {
    riskLevel = 'medium';
  } else if (flags.length >= 1) {
    riskLevel = 'low';
  }
  
  return {
    isSuspicious: flags.length > 0,
    flags,
    details,
    riskLevel,
    category
  };
}

async function analyzeVideoMetadata(fileUrl: string): Promise<ScanResult> {
  const flags: string[] = [];
  const details: Record<string, any> = {};
  let category: ScanResult['category'] = 'clean';
  
  try {
    // Fetch file headers
    const response = await fetch(fileUrl, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0');
    
    details.contentType = contentType;
    details.fileSize = contentLength;
    
    // Fetch beginning of file for metadata analysis
    const fileResponse = await fetch(fileUrl, {
      headers: { 'Range': 'bytes=0-131072' } // First 128KB for metadata
    });
    const arrayBuffer = await fileResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    const fileContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const fileContentLower = fileContent.toLowerCase();
    
    // Check for video editing software
    for (const encoder of SUSPICIOUS_ENCODERS) {
      if (fileContentLower.includes(encoder)) {
        const encoderName = encoder.toUpperCase();
        flags.push(`🎬 VIDEO EDITED: Processed with ${encoderName} - not original recording`);
        details.encoder = encoder;
        category = 'manipulation';
        break;
      }
    }
    
    // Check for re-encoding signatures
    for (const sign of REENCODING_SIGNS) {
      if (fileContentLower.includes(sign)) {
        flags.push(`🔄 RE-ENCODED: Video was re-processed using ${sign.toUpperCase()} - original may have been altered`);
        details.reencoder = sign;
        category = 'manipulation';
        break;
      }
    }
    
    // Check for multiple audio tracks (editing indicator)
    const audioTrackMatches = fileContent.match(/audio/gi);
    if (audioTrackMatches && audioTrackMatches.length > 2) {
      flags.push('🔊 AUDIO EDITED: Multiple audio tracks detected - audio may have been replaced or overlaid');
      category = 'manipulation';
    }
    
    // Check for cut/splice markers
    if (fileContentLower.includes('chapter') || fileContentLower.includes('segment')) {
      flags.push('✂️ SPLICED VIDEO: Chapter/segment markers found - video clips may have been joined or cut');
      category = 'manipulation';
    }
    
    // Check for screen recording metadata
    if (fileContentLower.includes('screen') && fileContentLower.includes('record')) {
      flags.push('🖥️ SCREEN RECORDING: Not direct game capture - could be recording of edited footage');
      details.isScreenRecording = true;
    }
    
    // WebM specific checks
    if (contentType.includes('webm')) {
      if (fileContentLower.includes('muxer') || fileContentLower.includes('muxing')) {
        flags.push('🔧 WEBM PROCESSED: Video was re-muxed - content may have been modified');
        category = 'manipulation';
      }
    }
    
  } catch (error) {
    console.error('Error analyzing video:', error);
    details.analysisError = String(error);
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (flags.length >= 3) {
    riskLevel = 'critical';
  } else if (flags.length >= 2) {
    riskLevel = 'high';
  } else if (flags.length >= 1) {
    riskLevel = 'medium';
  }
  
  return {
    isSuspicious: flags.length > 0,
    flags,
    details,
    riskLevel,
    category
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { fileUrls, submissionType, submissionId, discordId, discordUsername, textContent } = await req.json();
    
    console.log(`Scanning submission: ${submissionType} - ${submissionId}`);
    
    const results: { url: string; result: ScanResult }[] = [];
    let overallSuspicious = false;
    let highestRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const allFlags: string[] = [];
    const riskOrder = ['low', 'medium', 'high', 'critical'];
    let primaryCategory: ScanResult['category'] = 'clean';
    
    // Scan text content for bad language and inappropriate content
    if (textContent && typeof textContent === 'string') {
      const textScanResult = scanTextContent(textContent);
      if (textScanResult.flags.length > 0) {
        overallSuspicious = true;
        allFlags.push(...textScanResult.flags);
        
        if (textScanResult.hasInappropriateContent) {
          primaryCategory = 'inappropriate';
          highestRisk = 'critical';
        } else if (textScanResult.hasBadLanguage) {
          primaryCategory = 'language';
          if (riskOrder.indexOf('high') > riskOrder.indexOf(highestRisk)) {
            highestRisk = 'high';
          }
        }
      }
    }
    
    // Scan files if provided
    if (fileUrls && Array.isArray(fileUrls) && fileUrls.length > 0) {
      console.log(`Scanning ${fileUrls.length} files`);
      
      for (const url of fileUrls) {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
        
        let result: ScanResult;
        
        if (isImage) {
          result = await analyzeImageMetadata(url);
        } else if (isVideo) {
          result = await analyzeVideoMetadata(url);
        } else {
          result = { isSuspicious: false, flags: [], details: { skipped: true }, riskLevel: 'low', category: 'clean' };
        }
        
        results.push({ url, result });
        
        if (result.isSuspicious) {
          overallSuspicious = true;
          allFlags.push(...result.flags);
          
          // Update highest risk level
          if (riskOrder.indexOf(result.riskLevel) > riskOrder.indexOf(highestRisk)) {
            highestRisk = result.riskLevel;
          }
          
          // Update primary category
          if (result.category !== 'clean' && primaryCategory === 'clean') {
            primaryCategory = result.category;
          }
        }
      }
    }
    
    console.log(`Scan complete. Suspicious: ${overallSuspicious}, Risk: ${highestRisk}, Category: ${primaryCategory}, Flags: ${allFlags.length}`);
    
    return new Response(
      JSON.stringify({
        overallSuspicious,
        highestRisk,
        primaryCategory,
        totalFlags: allFlags.length,
        allFlags: [...new Set(allFlags)], // Remove duplicates
        results,
        submissionType,
        submissionId,
        discordId,
        discordUsername
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in scan-file-metadata:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
