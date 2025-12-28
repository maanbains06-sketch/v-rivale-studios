import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, Send, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerImage from "@/assets/header-rules.jpg";

interface RuleItem {
  emoji: string;
  text: string;
}

interface RuleSection {
  id: string;
  section_key: string;
  title: string;
  color: number;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  rules: RuleItem[];
}

const AdminDiscordRules = () => {
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const { data: sections, isLoading } = useQuery({
    queryKey: ['discord-rules-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discord_rules_sections')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return (data || []).map((section) => ({
        ...section,
        rules: Array.isArray(section.rules) 
          ? section.rules as unknown as RuleItem[]
          : [],
      })) as RuleSection[];
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async (section: Partial<RuleSection> & { id: string }) => {
      const { error } = await supabase
        .from('discord_rules_sections')
        .update({
          title: section.title,
          color: section.color,
          image_url: section.image_url,
          is_active: section.is_active,
          rules: section.rules as unknown as any,
          display_order: section.display_order,
        })
        .eq('id', section.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-rules-sections'] });
      toast.success('Section updated successfully');
      setEditingSection(null);
    },
    onError: (error) => {
      toast.error('Failed to update section: ' + error.message);
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = sections?.reduce((max, s) => Math.max(max, s.display_order), 0) || 0;
      const { error } = await supabase
        .from('discord_rules_sections')
        .insert({
          section_key: `section_${Date.now()}`,
          title: '〘 📋 〙 **__NEW SECTION__**',
          color: 3447003,
          display_order: maxOrder + 1,
          rules: [{ emoji: '🔸', text: '***New rule***' }],
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-rules-sections'] });
      toast.success('New section added');
    },
    onError: (error) => {
      toast.error('Failed to add section: ' + error.message);
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('discord_rules_sections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-rules-sections'] });
      toast.success('Section deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete section: ' + error.message);
    },
  });

  const publishRulesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-rules-to-discord');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Rules published to Discord! ${data.sectionsPosted} sections posted.`);
    },
    onError: (error) => {
      toast.error('Failed to publish rules: ' + error.message);
    },
  });

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!sections) return;
    
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const currentSection = sections[currentIndex];
    const swapSection = sections[newIndex];
    
    // Swap display orders
    await updateSectionMutation.mutateAsync({
      id: currentSection.id,
      display_order: swapSection.display_order,
    });
    await updateSectionMutation.mutateAsync({
      id: swapSection.id,
      display_order: currentSection.display_order,
    });
  };

  const colorToHex = (color: number) => {
    return '#' + color.toString(16).padStart(6, '0');
  };

  const hexToColor = (hex: string) => {
    return parseInt(hex.replace('#', ''), 16);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Discord Rules Editor"
        description="Edit and manage server rules that are posted to Discord"
        backgroundImage={headerImage}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Rules Sections</h2>
          <div className="flex gap-4">
            <Button onClick={() => addSectionMutation.mutate()} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
            <Button 
              onClick={() => publishRulesMutation.mutate()} 
              disabled={publishRulesMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {publishRulesMutation.isPending ? 'Publishing...' : 'Publish to Discord'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {sections?.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              isEditing={editingSection === section.id}
              onEdit={() => setEditingSection(section.id)}
              onSave={(updated) => updateSectionMutation.mutate({ ...updated, id: section.id })}
              onDelete={() => deleteSectionMutation.mutate(section.id)}
              onMoveUp={() => moveSection(section.id, 'up')}
              onMoveDown={() => moveSection(section.id, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < (sections?.length || 0) - 1}
              colorToHex={colorToHex}
              hexToColor={hexToColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface SectionEditorProps {
  section: RuleSection;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (section: Partial<RuleSection>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  colorToHex: (color: number) => string;
  hexToColor: (hex: string) => number;
}

const SectionEditor = ({
  section,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  colorToHex,
  hexToColor,
}: SectionEditorProps) => {
  const [title, setTitle] = useState(section.title);
  const [color, setColor] = useState(colorToHex(section.color));
  const [imageUrl, setImageUrl] = useState(section.image_url || '');
  const [isActive, setIsActive] = useState(section.is_active);
  const [rules, setRules] = useState<RuleItem[]>(
    Array.isArray(section.rules) ? section.rules : []
  );

  const handleSave = () => {
    onSave({
      title,
      color: hexToColor(color),
      image_url: imageUrl || null,
      is_active: isActive,
      rules,
    });
  };

  const addRule = () => {
    setRules([...rules, { emoji: '🔸', text: '***New rule***' }]);
  };

  const updateRule = (index: number, field: 'emoji' | 'text', value: string) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  return (
    <Card 
      className="border-l-4" 
      style={{ borderLeftColor: colorToHex(section.color) }}
    >
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col">
            <CardTitle className="text-lg">{section.title.replace(/[*_〘〙]/g, '')}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {section.is_active ? 'Active' : 'Inactive'} • {Array.isArray(section.rules) ? section.rules.length : 0} rules
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onMoveUp} disabled={!canMoveUp}>
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onMoveDown} disabled={!canMoveDown}>
            <ArrowDown className="w-4 h-4" />
          </Button>
          {!isEditing ? (
            <Button size="sm" onClick={onEdit}>Edit</Button>
          ) : (
            <>
              <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="destructive" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      {isEditing && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title (Discord Markdown)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Embed Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label>Image URL</Label>
            <Input 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Rules</Label>
              <Button size="sm" variant="outline" onClick={addRule}>
                <Plus className="w-4 h-4 mr-1" /> Add Rule
              </Button>
            </div>
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    value={rule.emoji}
                    onChange={(e) => updateRule(index, 'emoji', e.target.value)}
                    className="w-16"
                    placeholder="🔸"
                  />
                  <Textarea
                    value={rule.text}
                    onChange={(e) => updateRule(index, 'text', e.target.value)}
                    className="flex-1 min-h-[40px]"
                    placeholder="***Rule text***"
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => removeRule(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AdminDiscordRules;
