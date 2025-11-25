import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useApplicationStatus } from "@/hooks/useApplicationStatus";
import { CheckCircle2, Circle, Clock, FileText, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const ApplicationStatus = () => {
  const { application, isLoading, statusInfo, timeline } = useApplicationStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = () => {
    switch (statusInfo.status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Application Status</h1>
          <p className="text-xl text-muted-foreground">
            Track the progress of your staff application
          </p>
        </div>

        {!application ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                No Application Found
              </CardTitle>
              <CardDescription>
                You haven't submitted a staff application yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/">
                <Button>Submit Application</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Status: <Badge variant={getStatusBadgeVariant()}>{statusInfo.label}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {statusInfo.description}
                    </CardDescription>
                  </div>
                  {statusInfo.status === "pending" && (
                    <Clock className="h-8 w-8 text-yellow-500" />
                  )}
                  {statusInfo.status === "approved" && (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  )}
                  {statusInfo.status === "rejected" && (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{statusInfo.progress}%</span>
                  </div>
                  <Progress value={statusInfo.progress} className="h-3" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-medium capitalize">{application.position.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
                <CardDescription>
                  Track your application through each stage of the review process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        {item.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                        {index < timeline.length - 1 && (
                          <div className={`w-0.5 h-12 mt-2 ${item.completed ? "bg-green-500" : "bg-muted"}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <h4 className={`font-medium ${!item.completed && "text-muted-foreground"}`}>
                          {item.label}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                        {item.date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            {application.admin_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Feedback from Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{application.admin_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {statusInfo.status === "approved" && (
              <Card className="border-green-500/50 bg-green-50/5">
                <CardHeader>
                  <CardTitle className="text-green-500">Next Steps</CardTitle>
                  <CardDescription>
                    Your application has been approved! Here's what to do next:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Check your email for onboarding instructions</li>
                    <li>Join the staff Discord server</li>
                    <li>Complete your training modules</li>
                    <li>Attend the new staff orientation</li>
                  </ol>
                  <Link to="/staff-onboarding">
                    <Button className="w-full">Start Onboarding</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationStatus;