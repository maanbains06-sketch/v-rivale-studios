import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeType } from '@/hooks/useActiveTheme';
import { 
  Palette, 
  Sparkles, 
  Check, 
  Flame, 
  Snowflake, 
  Ghost, 
  PartyPopper, 
  Cake, 
  Sun,
  Loader2
} from 'lucide-react';

interface ThemeOption {
  id: ThemeType;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
  colors: string[];
}

const THEMES: ThemeOption[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard website theme with no decorations',
    icon: <Sun className="w-5 h-5" />,
    preview: '🌐',
    colors: ['#0ea5e9', '#0d1117', '#1e293b'],
  },
  {
    id: 'diwali',
    name: 'Diwali',
    description: 'Festival of lights with diyas, rangoli, and golden sparkles',
    icon: <Flame className="w-5 h-5 text-orange-400" />,
    preview: '🪔',
    colors: ['#ff9933', '#ffd700', '#ff6600'],
  },
  {
    id: 'holi',
    name: 'Holi',
    description: 'Festival of colors with vibrant splashes and color powder',
    icon: <Palette className="w-5 h-5 text-pink-400" />,
    preview: '🎨',
    colors: ['#ff1493', '#00ff00', '#ffd700', '#9400d3'],
  },
  {
    id: 'halloween',
    name: 'Halloween',
    description: 'Spooky decorations with pumpkins, bats, and ghosts',
    icon: <Ghost className="w-5 h-5 text-orange-500" />,
    preview: '🎃',
    colors: ['#ff6600', '#800080', '#000000'],
  },
  {
    id: 'winter',
    name: 'Winter',
    description: 'Snowy theme with falling snowflakes and ice crystals',
    icon: <Snowflake className="w-5 h-5 text-blue-300" />,
    preview: '❄️',
    colors: ['#87ceeb', '#ffffff', '#b0e0e6'],
  },
  {
    id: 'christmas',
    name: 'Christmas',
    description: 'Festive decorations with trees, lights, and presents',
    icon: <Sparkles className="w-5 h-5 text-red-500" />,
    preview: '🎄',
    colors: ['#ff0000', '#00ff00', '#ffd700'],
  },
  {
    id: 'new_year',
    name: 'New Year',
    description: 'Celebration with fireworks, confetti, and champagne',
    icon: <PartyPopper className="w-5 h-5 text-yellow-400" />,
    preview: '🎆',
    colors: ['#ffd700', '#ff69b4', '#00ced1'],
  },
  {
    id: 'birthday',
    name: 'Birthday',
    description: 'Party decorations with balloons, cake, and confetti',
    icon: <Cake className="w-5 h-5 text-pink-500" />,
    preview: '🎂',
    colors: ['#ff69b4', '#8a2be2', '#00bfff'],
  },
];

const ThemeManager = () => {
  const { toast } = useToast();
  const [activeTheme, setActiveTheme] = useState<ThemeType>('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentTheme();
  }, []);

  const fetchCurrentTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'active_theme')
        .single();

      if (error) {
        console.error('Error fetching theme:', error);
        return;
      }

      if (data?.value) {
        setActiveTheme(data.value as ThemeType);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (themeId: ThemeType) => {
    setSaving(true);
    
    // Optimistically update UI
    const previousTheme = activeTheme;
    setActiveTheme(themeId);
    
    // Update localStorage cache immediately
    try {
      localStorage.setItem('slrp_active_theme', themeId);
    } catch {
      // Ignore storage errors
    }

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key: 'active_theme', value: themeId, description: 'Currently active website theme' },
          { onConflict: 'key' }
        );

      if (error) {
        // Revert on error
        setActiveTheme(previousTheme);
        try {
          localStorage.setItem('slrp_active_theme', previousTheme);
        } catch {}
        
        toast({
          title: 'Error',
          description: 'Failed to update theme. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const themeName = THEMES.find(t => t.id === themeId)?.name || themeId;
      toast({
        title: 'Theme Updated',
        description: `Website theme changed to ${themeName}. Decorations will appear immediately across the site.`,
      });
    } catch (err) {
      // Revert on error
      setActiveTheme(previousTheme);
      try {
        localStorage.setItem('slrp_active_theme', previousTheme);
      } catch {}
      
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <CardTitle className="text-gradient">Website Theme</CardTitle>
        </div>
        <CardDescription>
          Choose a festive theme to add decorations across the entire website. Themes apply immediately to all visitors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                disabled={saving}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all duration-300
                  ${isActive 
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                    : 'border-border/30 bg-card/50 hover:border-primary/50 hover:bg-card'
                  }
                  ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Check className="w-3 h-3" />
                      Active
                    </Badge>
                  </div>
                )}

                {/* Theme Preview */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">{theme.preview}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      {theme.icon}
                      <span className="font-semibold text-foreground">{theme.name}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">
                  {theme.description}
                </p>

                {/* Color Preview */}
                <div className="flex gap-1">
                  {theme.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Theme Decorations</p>
              <p className="text-sm text-muted-foreground mt-1">
                When a theme is active, festive decorations will appear on all pages. These are purely visual and don't affect functionality. 
                Select "Default" to remove all decorations and return to the standard look.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeManager;
