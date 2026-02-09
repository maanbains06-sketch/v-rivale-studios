import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple fingerprint generator (canvas + WebGL + screen + timezone)
function generateFingerprint(): string {
  const components: string[] = [];

  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  components.push(screen.pixelDepth?.toString() || '0');

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency
  components.push((navigator.hardwareConcurrency || 0).toString());

  // Device memory (if available)
  components.push(((navigator as any).deviceMemory || 0).toString());

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.font = '11pt Arial';
      ctx.fillText('SLRP Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18pt Arial';
      ctx.fillText('SLRP Fingerprint', 4, 45);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch { /* ignore */ }

  // WebGL renderer
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        components.push((gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
      }
    }
  } catch { /* ignore */ }

  // Hash all components
  const raw = components.join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + raw.length.toString(36);
}

export function useDeviceFingerprint() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    const checkDevice = async () => {
      try {
        const fp = generateFingerprint();
        setFingerprint(fp);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.functions.invoke('detect-alt-accounts', {
          body: {
            user_id: user.id,
            fingerprint_hash: fp,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
          },
        });

        if (data?.blocked) {
          setIsBlocked(true);
          setBlockReason(data.reason || 'Access denied.');
        }
      } catch (error) {
        console.error('Fingerprint check error:', error);
      }
    };

    checkDevice();
  }, []);

  return { isBlocked, blockReason, fingerprint };
}
