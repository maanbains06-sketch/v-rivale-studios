import { Label } from "@/components/ui/label";
import { Ribbon, Globe, AlertOctagon, CreditCard, Bug, ShieldAlert } from "lucide-react";

interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const categories: SupportCategory[] = [
  {
    id: 'general',
    name: 'General Support',
    description: 'Questions, guidance, or general assistance',
    icon: <Ribbon className="w-6 h-6" />,
    color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-500/60'
  },
  {
    id: 'ingame',
    name: 'In-Game Support',
    description: 'In-game issues for whitelisted members',
    icon: <Globe className="w-6 h-6" />,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/60'
  },
  {
    id: 'report',
    name: 'Player Report',
    description: 'Report rule violations or player misconduct',
    icon: <AlertOctagon className="w-6 h-6" />,
    color: 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-500/60'
  },
  {
    id: 'staff_report',
    name: 'Staff Report',
    description: 'Report staff misconduct or abuse of power',
    icon: <ShieldAlert className="w-6 h-6" />,
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/60'
  },
  {
    id: 'purchase',
    name: 'Purchase Support',
    description: 'Store purchases, billing, or payment issues',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/60'
  },
  {
    id: 'bug',
    name: 'Bug Report',
    description: 'Report bugs, glitches, or technical problems',
    icon: <Bug className="w-6 h-6" />,
    color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-500/60'
  }
];

interface SupportChatCategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const SupportChatCategorySelector = ({ 
  selectedCategory, 
  onSelectCategory 
}: SupportChatCategorySelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Select Category</Label>
      <div className="grid gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={`
              flex items-center gap-4 p-4 rounded-lg border transition-all duration-200
              bg-gradient-to-r ${category.color}
              ${selectedCategory === category.id 
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                : ''
              }
            `}
          >
            <div className="flex-shrink-0 text-foreground/80">
              {category.icon}
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">{category.name}</p>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const getCategoryLabel = (categoryId: string): string => {
  return categories.find(c => c.id === categoryId)?.name || 'General Support';
};

export const getCategoryTags = (categoryId: string): string[] => {
  switch (categoryId) {
    case 'ingame':
      return ['in-game', 'whitelisted'];
    case 'report':
      return ['player-report', 'misconduct'];
    case 'staff_report':
      return ['staff-report', 'staff-misconduct', 'confidential'];
    case 'purchase':
      return ['billing', 'purchase', 'payment'];
    case 'bug':
      return ['bug', 'technical'];
    default:
      return ['general'];
  }
};

export default SupportChatCategorySelector;
