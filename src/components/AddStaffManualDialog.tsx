import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

interface AddStaffManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentLabel: string;
  departmentKey: string;
  ranks: string[];
  divisionOptions: { value: string; label: string }[];
  unitOptions: { value: string; label: string }[];
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'on_training', label: 'On Training' },
];

const AddStaffManualDialog = ({
  open,
  onOpenChange,
  departmentLabel,
  departmentKey,
  ranks,
  divisionOptions,
  unitOptions,
  onSuccess,
}: AddStaffManualDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    badge_number: '',
    status: 'active',
    division: '',
    call_sign: '',
    strikes: '0/3',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    if (!formData.rank) {
      toast.error('Please select a rank');
      return;
    }

    setLoading(true);
    try {
      // Generate unique placeholder for discord_id - ensures uniqueness
      const placeholderId = `ROSTER-${departmentKey.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const insertData = {
        name: formData.name.trim(),
        role: formData.rank,
        role_type: 'member', // Non-staff departments get 'member' role type
        department: departmentKey,
        badge_number: formData.badge_number?.trim() || null,
        status: formData.status || 'active',
        division: formData.division || null,
        call_sign: formData.call_sign || null,
        strikes: formData.strikes || '0/3',
        discord_id: placeholderId,
        is_active: formData.status === 'active' || formData.status === 'on_training',
        responsibilities: [], // Required array field
      };

      console.log('Inserting roster member:', insertData);

      const { data, error } = await supabase
        .from('staff_members')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Roster member added:', data);
      toast.success(`${formData.name} added to ${departmentLabel} successfully!`);
      handleReset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding roster member:', error);
      toast.error(error.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      rank: '',
      badge_number: '',
      status: 'active',
      division: '',
      call_sign: '',
      strikes: '0/3',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Member to {departmentLabel}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter member name"
              className="h-10"
            />
          </div>

          {/* Rank Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="rank" className="text-sm font-medium">
              Rank <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.rank}
              onValueChange={(value) => setFormData(prev => ({ ...prev, rank: value }))}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                {ranks.map(rank => (
                  <SelectItem key={rank} value={rank}>
                    {rank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Badge Number */}
          <div className="space-y-2">
            <Label htmlFor="badge" className="text-sm font-medium">Badge Number</Label>
            <Input
              id="badge"
              value={formData.badge_number}
              onChange={(e) => setFormData(prev => ({ ...prev, badge_number: e.target.value }))}
              placeholder="e.g., 1-ADAM-1"
              className="h-10 font-mono"
            />
          </div>

          {/* Status Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Division Dropdown */}
          {divisionOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="division" className="text-sm font-medium">Division</Label>
              <Select
                value={formData.division}
                onValueChange={(value) => setFormData(prev => ({ ...prev, division: value }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  {divisionOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department/Unit Dropdown */}
          {unitOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium">{departmentKey === 'police' ? 'Department' : 'Unit'}</Label>
              <Select
                value={formData.call_sign}
                onValueChange={(value) => setFormData(prev => ({ ...prev, call_sign: value }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={departmentKey === 'police' ? 'Select department' : 'Select unit'} />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  {unitOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action */}
          <div className="space-y-2">
            <Label htmlFor="action" className="text-sm font-medium">Action</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="on_training">On Training</SelectItem>
                <SelectItem value="fired">Fired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Strikes */}
          <div className="space-y-2">
            <Label htmlFor="strikes" className="text-sm font-medium">Strikes</Label>
            <Input
              id="strikes"
              value={formData.strikes}
              onChange={(e) => setFormData(prev => ({ ...prev, strikes: e.target.value }))}
              placeholder="e.g., 0/3"
              className="h-10"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffManualDialog;
