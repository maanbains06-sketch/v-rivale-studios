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
}

// Known editing software signatures in EXIF data
const EDITING_SOFTWARE = [
  'photoshop', 'gimp', 'lightroom', 'snapseed', 'picsart', 'canva',
  'pixlr', 'fotor', 'befunky', 'paint.net', 'affinity', 'capture one',
  'luminar', 'darktable', 'rawtherapee', 'photo editor', 'image editor',
  'adobe', 'corel', 'paintshop', 'acdsee', 'photoscape', 'picmonkey',
  'fotoflexer', 'ipiccy', 'ribbet', 'sumopaint', 'polarr', 'vsco',
  'afterlight', 'enlight', 'mextures', 'facetune', 'airbrush', 'retouch',
  'remove.bg', 'photoroom', 'background eraser', 'cut out', 'remove object'
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

async function analyzeImageMetadata(fileUrl: string): Promise<ScanResult> {
  const flags: string[] = [];
  const details: Record<string, any> = {};
  
  try {
    // Fetch file headers to check content type
    const response = await fetch(fileUrl, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0');
    
    details.contentType = contentType;
    details.fileSize = contentLength;
    
    // Check for very small file sizes (potential cropped/edited)
    if (contentLength < 10000 && contentType.includes('image')) {
      flags.push('Unusually small file size - possible heavy compression or cropping');
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
        flags.push(`Editing software detected: ${software.charAt(0).toUpperCase() + software.slice(1)}`);
        details.editingSoftware = software;
        break;
      }
    }
    
    // Check for modification timestamps in metadata
    if (fileContentLower.includes('modifydate') || fileContentLower.includes('modify date')) {
      flags.push('File modification metadata detected - image may have been altered');
    }
    
    // Check for history/undo data (Photoshop specific)
    if (fileContentLower.includes('photoshop') && fileContentLower.includes('history')) {
      flags.push('Photoshop edit history detected - multiple edits made');
    }
    
    // Check for layer data (indicates composite image)
    if (fileContentLower.includes('layer') && (fileContentLower.includes('composite') || fileContentLower.includes('merged'))) {
      flags.push('Layer composite data detected - image created from multiple sources');
    }
    
    // Check for clone/heal tool markers
    if (fileContentLower.includes('heal') || fileContentLower.includes('clone') || fileContentLower.includes('spot')) {
      flags.push('Healing/Clone tool markers found - parts of image may be artificially modified');
    }
    
    // Check PNG for text chunks that indicate editing
    if (contentType.includes('png')) {
      if (fileContentLower.includes('software') || fileContentLower.includes('creator')) {
        const softwareMatch = fileContentLower.match(/software[:\s]+([a-z0-9\s.]+)/i);
        if (softwareMatch) {
          for (const editSoft of EDITING_SOFTWARE) {
            if (softwareMatch[1].toLowerCase().includes(editSoft)) {
              flags.push(`PNG created/modified with: ${editSoft}`);
              break;
            }
          }
        }
      }
    }
    
    // Check for screenshot indicators that might be manipulated
    if (fileContentLower.includes('screenshot') && flags.length > 0) {
      flags.push('Screenshot with editing markers - may be manipulated screenshot');
    }
    
    // Analyze JPEG quality markers for re-saving
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      // Multiple JFIF markers indicate re-saving
      const jfifCount = (fileContent.match(/JFIF/g) || []).length;
      if (jfifCount > 1) {
        flags.push('Multiple JPEG save operations detected - image has been re-saved');
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
    riskLevel
  };
}

async function analyzeVideoMetadata(fileUrl: string): Promise<ScanResult> {
  const flags: string[] = [];
  const details: Record<string, any> = {};
  
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
        flags.push(`Video editing/encoding software detected: ${encoder.toUpperCase()}`);
        details.encoder = encoder;
        break;
      }
    }
    
    // Check for re-encoding signatures
    for (const sign of REENCODING_SIGNS) {
      if (fileContentLower.includes(sign)) {
        flags.push(`Re-encoding marker found: ${sign} - video may have been processed/edited`);
        details.reencoder = sign;
        break;
      }
    }
    
    // Check for multiple audio tracks (editing indicator)
    const audioTrackMatches = fileContent.match(/audio/gi);
    if (audioTrackMatches && audioTrackMatches.length > 2) {
      flags.push('Multiple audio track references - video may have edited audio');
    }
    
    // Check for cut/splice markers
    if (fileContentLower.includes('chapter') || fileContentLower.includes('segment')) {
      flags.push('Video chapter/segment markers detected - video may be spliced');
    }
    
    // Check for screen recording metadata
    if (fileContentLower.includes('screen') && fileContentLower.includes('record')) {
      flags.push('Screen recording metadata detected');
    }
    
    // WebM specific checks
    if (contentType.includes('webm')) {
      if (fileContentLower.includes('muxer') || fileContentLower.includes('muxing')) {
        flags.push('WebM muxing metadata - video has been re-processed');
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
    riskLevel
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { fileUrls, submissionType, submissionId, discordId, discordUsername } = await req.json();
    
    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No file URLs provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Scanning ${fileUrls.length} files for submission: ${submissionType} - ${submissionId}`);
    
    const results: { url: string; result: ScanResult }[] = [];
    let overallSuspicious = false;
    let highestRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const allFlags: string[] = [];
    
    for (const url of fileUrls) {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
      
      let result: ScanResult;
      
      if (isImage) {
        result = await analyzeImageMetadata(url);
      } else if (isVideo) {
        result = await analyzeVideoMetadata(url);
      } else {
        result = { isSuspicious: false, flags: [], details: { skipped: true }, riskLevel: 'low' };
      }
      
      results.push({ url, result });
      
      if (result.isSuspicious) {
        overallSuspicious = true;
        allFlags.push(...result.flags);
        
        // Update highest risk level
        const riskOrder = ['low', 'medium', 'high', 'critical'];
        if (riskOrder.indexOf(result.riskLevel) > riskOrder.indexOf(highestRisk)) {
          highestRisk = result.riskLevel;
        }
      }
    }
    
    console.log(`Scan complete. Suspicious: ${overallSuspicious}, Risk: ${highestRisk}, Flags: ${allFlags.length}`);
    
    return new Response(
      JSON.stringify({
        overallSuspicious,
        highestRisk,
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
