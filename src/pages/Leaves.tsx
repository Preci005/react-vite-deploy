import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Leaves = () => {
  const [user, setUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchLeaves(session.user.id);
      }
    });
  }, [navigate]);

  const fetchLeaves = async (userId: string) => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive",
      });
    } else {
      setLeaves(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("leave_requests").insert({
      employee_id: user.id,
      ...formData,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });
      setShowForm(false);
      setFormData({
        leave_type: "annual",
        start_date: "",
        end_date: "",
        reason: "",
      });
      fetchLeaves(user.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { icon: Clock, className: "bg-accent text-accent-foreground" },
      approved: { icon: CheckCircle, className: "bg-primary text-primary-foreground" },
      rejected: { icon: XCircle, className: "bg-destructive text-destructive-foreground" },
    };

    const { icon: Icon, className } = variants[status];
    return (
      <Badge className={className}>
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Leave Management</h1>
              <p className="text-muted-foreground">Apply for and track your leave requests</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Leave Request</CardTitle>
              <CardDescription>Fill in the details for your leave application</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leave_type">Leave Type</Label>
                    <Select
                      value={formData.leave_type}
                      onValueChange={(value) => setFormData({ ...formData, leave_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a reason for your leave request"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                <div className="flex space-x-4">
                  <Button type="submit">Submit Request</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Leave Requests</CardTitle>
            <CardDescription>View all your submitted leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No leave requests found</p>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold capitalize">{leave.leave_type} Leave</h3>
                        {getStatusBadge(leave.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(leave.start_date).toLocaleDateString()} -{" "}
                        {new Date(leave.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-foreground mt-2">{leave.reason}</p>
                      {leave.admin_notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          Admin notes: {leave.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaves;
