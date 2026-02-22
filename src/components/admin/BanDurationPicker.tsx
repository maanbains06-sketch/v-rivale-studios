import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BanDuration {
  type: "hours" | "days" | "permanent";
  value?: number;
}

interface BanDurationPickerProps {
  value: BanDuration;
  onChange: (duration: BanDuration) => void;
}

const PRESET_HOURS = [1, 2, 3, 6, 12];
const PRESET_DAYS = [1, 2, 3, 7, 14, 30];

const BanDurationPicker = ({ value, onChange }: BanDurationPickerProps) => {
  const [customValue, setCustomValue] = useState("");
  const [customUnit, setCustomUnit] = useState<"hours" | "days">("hours");

  const isSelected = (type: string, val?: number) => {
    if (type === "permanent") return value.type === "permanent";
    return value.type === type && value.value === val;
  };

  const handleCustomApply = () => {
    const num = parseInt(customValue);
    if (num > 0) {
      onChange({ type: customUnit, value: num });
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold uppercase tracking-wide">Ban Duration</Label>

      {/* Hours presets */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> Hours
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_HOURS.map((h) => (
            <Button
              key={`h-${h}`}
              type="button"
              size="sm"
              variant={isSelected("hours", h) ? "default" : "outline"}
              className={cn("text-xs h-7 px-2.5", isSelected("hours", h) && "bg-primary")}
              onClick={() => onChange({ type: "hours", value: h })}
            >
              {h}h
            </Button>
          ))}
        </div>
      </div>

      {/* Days presets */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> Days
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_DAYS.map((d) => (
            <Button
              key={`d-${d}`}
              type="button"
              size="sm"
              variant={isSelected("days", d) ? "default" : "outline"}
              className={cn("text-xs h-7 px-2.5", isSelected("days", d) && "bg-primary")}
              onClick={() => onChange({ type: "days", value: d })}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Custom */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Custom Duration</p>
        <div className="flex gap-1.5 items-center">
          <Input
            type="number"
            min="1"
            placeholder="Value"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-20 h-7 text-xs"
          />
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={customUnit === "hours" ? "default" : "outline"}
              className="text-xs h-7 px-2"
              onClick={() => setCustomUnit("hours")}
            >
              Hours
            </Button>
            <Button
              type="button"
              size="sm"
              variant={customUnit === "days" ? "default" : "outline"}
              className="text-xs h-7 px-2"
              onClick={() => setCustomUnit("days")}
            >
              Days
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="text-xs h-7 px-2"
            onClick={handleCustomApply}
            disabled={!customValue || parseInt(customValue) <= 0}
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Permanent */}
      <Button
        type="button"
        size="sm"
        variant={value.type === "permanent" ? "destructive" : "outline"}
        className={cn("w-full text-xs h-8", !isSelected("permanent", undefined) && "border-destructive/40 text-destructive hover:bg-destructive/10")}
        onClick={() => onChange({ type: "permanent" })}
      >
        <Ban className="w-3 h-3 mr-1" />
        Permanent Ban
      </Button>

      {/* Selected display */}
      <div className="text-xs text-center py-1 px-2 rounded bg-muted/50">
        Selected:{" "}
        <span className="font-semibold text-primary">
          {value.type === "permanent"
            ? "Permanent"
            : `${value.value} ${value.type}`}
        </span>
      </div>
    </div>
  );
};

export default BanDurationPicker;
