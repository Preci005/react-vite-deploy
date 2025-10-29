import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkAdminStatus(session.user.id);
      }
    });
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!data) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/dashboard");
    } else {
      setIsAdmin(true);
      fetchData();
    }
  };

  const fetchData = async () => {
    const { data: employeesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: leavesData } = await supabase
      .from("leave_requests")
      .select(`
        *,
        profiles:employee_id (full_name, employee_id)
      `)
      .order("created_at", { ascending: false });

    const { data: timesheetsData } = await supabase
      .from("timesheets")
      .select(`
        *,
        profiles:employee_id (full_name, employee_id)
      `)
      .order("work_date", { ascending: false })
      .limit(50);

    setEmployees(employeesData || []);
    setLeaveRequests(leavesData || []);
    setTimesheets(timesheetsData || []);
  };

  const handleLeaveAction = async (leaveId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status, admin_notes: adminNotes })
      .eq("id", leaveId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Leave request ${status}`,
      });
      setSelectedLeave(null);
      setAdminNotes("");
      fetchData();
    }
  };

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage employees, leaves, and timesheets</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="leaves" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaves">
              <Calendar className="mr-2 h-4 w-4" />
              Leave Requests
            </TabsTrigger>
            <TabsTrigger value="timesheets">
              <Clock className="mr-2 h-4 w-4" />
              Timesheets
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Users className="mr-2 h-4 w-4" />
              Employees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaves">
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Review and manage employee leave applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaveRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No leave requests</p>
                  ) : (
                    leaveRequests.map((leave) => (
                      <div
                        key={leave.id}
                        className="rounded-lg border border-border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{leave.profiles?.full_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {leave.profiles?.employee_id}
                            </p>
                          </div>
                          <Badge
                            variant={
                              leave.status === "approved"
                                ? "default"
                                : leave.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {leave.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{leave.leave_type} Leave</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(leave.start_date).toLocaleDateString()} -{" "}
                            {new Date(leave.end_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm mt-2">{leave.reason}</p>
                        </div>
                        {leave.status === "pending" && (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Add notes (optional)"
                              value={selectedLeave?.id === leave.id ? adminNotes : ""}
                              onChange={(e) => {
                                setSelectedLeave(leave);
                                setAdminNotes(e.target.value);
                              }}
                              rows={2}
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleLeaveAction(leave.id, "approved")}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleLeaveAction(leave.id, "rejected")}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                        {leave.admin_notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Admin notes: {leave.admin_notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timesheets">
            <Card>
              <CardHeader>
                <CardTitle>Timesheets</CardTitle>
                <CardDescription>View employee work hours and entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timesheets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No timesheet entries</p>
                  ) : (
                    timesheets.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{entry.profiles?.full_name}</h3>
                            <Badge variant="outline">
                              {entry.profiles?.employee_id}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(entry.work_date).toLocaleDateString()} -{" "}
                            {entry.hours_worked} hours
                          </p>
                          {entry.project_name && (
                            <p className="text-sm text-primary mt-1">{entry.project_name}</p>
                          )}
                          {entry.description && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Employees</CardTitle>
                <CardDescription>View and manage employee profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No employees</p>
                  ) : (
                    employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <h3 className="font-semibold">{employee.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.employee_id}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                          {employee.department && (
                            <p className="text-sm text-primary mt-1">
                              {employee.department} - {employee.position}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
