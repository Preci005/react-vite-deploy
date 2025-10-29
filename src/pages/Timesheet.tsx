import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Save, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Timesheet = () => {
  const [user, setUser] = useState<any>(null);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    work_date: new Date().toISOString().split("T")[0],
    hours_worked: "",
    project_name: "",
    description: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchTimesheets(session.user.id);
      }
    });
  }, [navigate]);

  const fetchTimesheets = async (userId: string) => {
    const { data, error } = await supabase
      .from("timesheets")
      .select("*")
      .eq("employee_id", userId)
      .order("work_date", { ascending: false })
      .limit(30);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch timesheets",
        variant: "destructive",
      });
    } else {
      setTimesheets(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parseFloat(formData.hours_worked) <= 0 || parseFloat(formData.hours_worked) > 24) {
      toast({
        title: "Invalid hours",
        description: "Hours must be between 0 and 24",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("timesheets").upsert({
      employee_id: user.id,
      work_date: formData.work_date,
      hours_worked: parseFloat(formData.hours_worked),
      project_name: formData.project_name,
      description: formData.description,
      submitted: true,
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
        description: "Timesheet entry saved successfully",
      });
      setShowForm(false);
      setFormData({
        work_date: new Date().toISOString().split("T")[0],
        hours_worked: "",
        project_name: "",
        description: "",
      });
      fetchTimesheets(user.id);
    }
  };

  const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.hours_worked), 0);

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
              <h1 className="text-3xl font-bold text-foreground">Timesheet</h1>
              <p className="text-muted-foreground">Log and track your work hours</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Clock className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          )}
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Hours (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{totalHours.toFixed(2)} hrs</div>
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Timesheet Entry</CardTitle>
              <CardDescription>Record your work hours for a specific date</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="work_date">Work Date</Label>
                    <Input
                      id="work_date"
                      type="date"
                      value={formData.work_date}
                      onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours_worked">Hours Worked</Label>
                    <Input
                      id="hours_worked"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="8.0"
                      value={formData.hours_worked}
                      onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_name">Project/Task Name</Label>
                  <Input
                    id="project_name"
                    placeholder="e.g., Project Alpha, Meeting, Development"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What did you work on?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex space-x-4">
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Entry
                  </Button>
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
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>Your timesheet history (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {timesheets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No timesheet entries found</p>
            ) : (
              <div className="space-y-4">
                {timesheets.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">
                          {new Date(entry.work_date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </h3>
                        <Badge variant="outline" className="ml-2">
                          <Clock className="mr-1 h-3 w-3" />
                          {entry.hours_worked} hrs
                        </Badge>
                      </div>
                      {entry.project_name && (
                        <p className="text-sm text-primary mt-1 font-medium">{entry.project_name}</p>
                      )}
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
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

export default Timesheet;
