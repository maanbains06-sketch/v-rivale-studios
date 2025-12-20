import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import RosterTable from "@/components/RosterTable";
import { useRoster, getDepartmentSections, getMechanicShops, getPdmShops } from "@/hooks/useRoster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Heart, Flame, Wrench, Car, Scale, Store, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Department images - GTA 5 themed
import rosterPolice from "@/assets/roster-police.jpg";
import rosterEms from "@/assets/roster-ems.jpg";
import rosterFire from "@/assets/roster-fire.jpg";
import rosterDoj from "@/assets/roster-doj.jpg";
import rosterMechanic from "@/assets/roster-mechanic.jpg";
import rosterPdm from "@/assets/roster-pdm.jpg";

interface Department {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  headerImage: string;
  hasShops?: boolean;
}

const departments: Department[] = [
  { id: "police", name: "Police Department", icon: Shield, color: "text-blue-400", headerImage: rosterPolice },
  { id: "ems", name: "EMS", icon: Heart, color: "text-red-400", headerImage: rosterEms },
  { id: "fire", name: "Fire Department", icon: Flame, color: "text-orange-400", headerImage: rosterFire },
  { id: "doj", name: "DOJ", icon: Scale, color: "text-amber-400", headerImage: rosterDoj },
  { id: "mechanic", name: "Mechanic", icon: Wrench, color: "text-cyan-400", headerImage: rosterMechanic, hasShops: true },
  { id: "pdm", name: "PDM Dealership", icon: Car, color: "text-pink-400", headerImage: rosterPdm, hasShops: true },
];

// Owner Discord ID for full access
const OWNER_DISCORD_ID = "833680146510381097";

// Component for a single shop roster
const ShopRoster = ({ 
  department, 
  shop, 
  isOwner,
  onShopNameChange 
}: { 
  department: string; 
  shop: { id: string; name: string; editable: boolean }; 
  isOwner: boolean;
  onShopNameChange: (shopId: string, newName: string) => void;
}) => {
  const sections = getDepartmentSections(department);
  const { entries, loading, canEdit, canView, permissions, refetch } = useRoster(department, shop.id);
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

  // If user can't view, show access denied message
  if (!canView) {
    return (
      <Card className="border-border/30 bg-muted/20">
        <CardHeader className="text-center">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            You don't have permission to view this roster. Only authorized staff members can access this content.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-border/30 pb-4">
        <Store className="w-5 h-5 text-muted-foreground" />
        {isEditingName && isOwner ? (
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
            {isOwner && shop.editable && (
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
const MultiShopRoster = ({ department, isOwner }: { department: string; isOwner: boolean }) => {
  const { toast } = useToast();
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  
  const shops = department === "mechanic" ? getMechanicShops() : getPdmShops();

  const handleShopNameChange = async (shopId: string, newName: string) => {
    // Update local state
    setShopNames(prev => ({ ...prev, [shopId]: newName }));
    
    // Save to database - update all entries with this shop_name
    try {
      // For now, just show toast as shop names are stored per-entry
      toast({
        title: "Shop name updated",
        description: `Shop renamed to "${newName}"`,
      });
    } catch (error) {
      toast({
        title: "Error updating shop name",
        variant: "destructive",
      });
    }
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
            isOwner={isOwner}
            onShopNameChange={handleShopNameChange}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

const DepartmentRoster = ({ departmentId }: { departmentId: string }) => {
  const sections = getDepartmentSections(departmentId);
  const { entries, loading, canEdit, canView, permissions, refetch } = useRoster(departmentId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If user can't view, show access denied message
  if (!canView) {
    return (
      <Card className="border-border/30 bg-muted/20">
        <CardHeader className="text-center">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            You don't have permission to view this roster. Only authorized staff members can access this content.
          </CardDescription>
        </CardHeader>
      </Card>
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
  const [isOwner, setIsOwner] = useState(false);
  const currentDept = departments.find(d => d.id === activeDepartment);
  const { toast } = useToast();

  // Check if current user is owner
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsOwner(false);
          return;
        }

        // Check if admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleData?.role === "admin") {
          setIsOwner(true);
          return;
        }

        // Check Discord ID
        let userDiscordId: string | null = null;

        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("discord_id")
          .eq("user_id", user.id)
          .single();

        if (staffMember?.discord_id) {
          userDiscordId = staffMember.discord_id;
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("discord_username")
            .eq("id", user.id)
            .single();
          
          if (profile?.discord_username && /^\d+$/.test(profile.discord_username)) {
            userDiscordId = profile.discord_username;
          }
        }

        // Check if owner by Discord ID
        if (userDiscordId === OWNER_DISCORD_ID) {
          setIsOwner(true);
          return;
        }

        // Check roster_owner_access table
        if (userDiscordId) {
          const { data: ownerAccess } = await supabase
            .from("roster_owner_access")
            .select("*")
            .eq("discord_id", userDiscordId)
            .single();

          if (ownerAccess) {
            setIsOwner(true);
            return;
          }
        }

        setIsOwner(false);
      } catch (error) {
        console.error("Error checking ownership:", error);
        setIsOwner(false);
      }
    };

    checkOwnership();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <PageHeader 
          title={`${currentDept?.name || "Server"} Roster`}
          description="View all department rosters and team members"
          badge="ROSTER"
          backgroundImage={currentDept?.headerImage || rosterPolice}
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
                    <MultiShopRoster department={dept.id} isOwner={isOwner} />
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
