import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerRoster from "@/assets/header-staff.jpg";

const Roster = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <PageHeader 
          title="Server Roster"
          description="View all department rosters and team members"
          badge="ROSTER"
          backgroundImage={headerRoster}
        />
        
        {/* Content will be added later */}
      </div>
    </div>
  );
};

export default Roster;
