import { useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import RosterTable from "@/components/RosterTable";
import { useRoster, getDepartmentSections, getMechanicShops, getPdmShops } from "@/hooks/useRoster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Heart, Flame, Wrench, Car, Scale, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Department images
import jobPoliceImg from "@/assets/job-police.jpg";
import jobEmsImg from "@/assets/job-ems.jpg";
import jobFirefighterImg from "@/assets/job-firefighter.jpg";
import jobMechanicImg from "@/assets/job-mechanic.jpg";
import jobPdmImg from "@/assets/job-pdm.jpg";
import headerDoj from "@/assets/header-doj.jpg";

interface Department {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  headerImage: string;
  hasShops?: boolean;
}

const departments: Department[] = [
  { id: "police", name: "Police Department", icon: Shield, color: "text-blue-400", headerImage: jobPoliceImg },
  { id: "ems", name: "EMS", icon: Heart, color: "text-red-400", headerImage: jobEmsImg },
  { id: "fire", name: "Fire Department", icon: Flame, color: "text-orange-400", headerImage: jobFirefighterImg },
  { id: "doj", name: "DOJ", icon: Scale, color: "text-amber-400", headerImage: headerDoj },
  { id: "mechanic", name: "Mechanic", icon: Wrench, color: "text-cyan-400", headerImage: jobMechanicImg, hasShops: true },
  { id: "pdm", name: "PDM Dealership", icon: Car, color: "text-pink-400", headerImage: jobPdmImg, hasShops: true },
];

// Component for a single shop roster
const ShopRoster = ({ 
  department, 
  shop, 
  canEditShopName,
  onShopNameChange 
}: { 
  department: string; 
  shop: { id: string; name: string; editable: boolean }; 
  canEditShopName: boolean;
  onShopNameChange: (shopId: string, newName: string) => void;
}) => {
  const sections = getDepartmentSections(department);
  const { entries, loading, canEdit, permissions, refetch } = useRoster(department, shop.id);
  const [isEditingName, setIsEditingName] = useState(false);
  const [shopName, setShopName] = useState(shop.name);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-border/30 pb-4">
        <Store className="w-5 h-5 text-muted-foreground" />
        {isEditingName && canEditShopName ? (
          <div className="flex items-center gap-2">
            <Input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="h-8 w-48"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                onShopNameChange(shop.id, shopName);
                setIsEditingName(false);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShopName(shop.name);
                setIsEditingName(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{shop.name}</h3>
            {canEditShopName && shop.editable && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => setIsEditingName(true)}
              >
                Edit Name
              </Button>
            )}
          </div>
        )}
      </div>
      <RosterTable
        entries={entries}
        department={department}
        sections={sections}
        canEdit={canEdit}
        permissions={permissions}
        onRefresh={refetch}
        shopName={shop.id}
      />
    </div>
  );
};

// Component for departments with multiple shops
const MultiShopRoster = ({ department }: { department: string }) => {
  const { toast } = useToast();
  const { canEdit: canEditRoster } = useRoster(department);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  
  const shops = department === "mechanic" ? getMechanicShops() : getPdmShops();

  const handleShopNameChange = async (shopId: string, newName: string) => {
    // Update local state
    setShopNames(prev => ({ ...prev, [shopId]: newName }));
    
    // In a real implementation, you would save this to the database
    // For now, we'll just show a toast
    toast({
      title: "Shop name updated",
      description: `Shop renamed to "${newName}"`,
    });
  };

  return (
    <Tabs defaultValue={shops[0].id} className="w-full">
      <TabsList className="mb-4">
        {shops.map((shop) => (
          <TabsTrigger key={shop.id} value={shop.id} className="gap-2">
            <Store className="w-4 h-4" />
            {shopNames[shop.id] || shop.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {shops.map((shop) => (
        <TabsContent key={shop.id} value={shop.id}>
          <ShopRoster
            department={department}
            shop={{ ...shop, name: shopNames[shop.id] || shop.name }}
            canEditShopName={canEditRoster}
            onShopNameChange={handleShopNameChange}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

const DepartmentRoster = ({ departmentId }: { departmentId: string }) => {
  const sections = getDepartmentSections(departmentId);
  const { entries, loading, canEdit, permissions, refetch } = useRoster(departmentId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <RosterTable
      entries={entries}
      department={departmentId}
      sections={sections}
      canEdit={canEdit}
      permissions={permissions}
      onRefresh={refetch}
    />
  );
};

const Roster = () => {
  const [activeDepartment, setActiveDepartment] = useState("police");
  const currentDept = departments.find(d => d.id === activeDepartment);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <PageHeader 
          title={`${currentDept?.name || "Server"} Roster`}
          description="View all department rosters and team members"
          badge="ROSTER"
          backgroundImage={currentDept?.headerImage || jobPoliceImg}
        />

        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeDepartment} onValueChange={setActiveDepartment} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-2 bg-muted/50 mb-8">
              {departments.map((dept) => {
                const Icon = dept.icon;
                return (
                  <TabsTrigger
                    key={dept.id}
                    value={dept.id}
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    <Icon className={`w-4 h-4 ${activeDepartment === dept.id ? "" : dept.color}`} />
                    <span className="hidden sm:inline">{dept.name}</span>
                    <span className="sm:hidden">{dept.id.toUpperCase()}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {departments.map((dept) => (
              <TabsContent key={dept.id} value={dept.id} className="mt-0">
                <div className="glass-effect rounded-xl p-6 border border-border/30">
                  <div className="flex items-center gap-3 mb-6">
                    <dept.icon className={`w-8 h-8 ${dept.color}`} />
                    <div>
                      <h2 className="text-2xl font-bold">{dept.name} Roster</h2>
                      <p className="text-muted-foreground text-sm">
                        All active members and their current status
                      </p>
                    </div>
                  </div>
                  {dept.hasShops ? (
                    <MultiShopRoster department={dept.id} />
                  ) : (
                    <DepartmentRoster departmentId={dept.id} />
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Roster;
