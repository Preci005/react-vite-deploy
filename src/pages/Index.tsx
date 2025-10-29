import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, Clock, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/dashboard");
        }
      });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <Users className="h-12 w-12" />
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            Employee Management System
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90">
            Streamline your workforce operations with our comprehensive management platform.
            Track leaves, manage timesheets, and empower your team.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => navigate("/auth")}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Leave Management</h3>
            <p className="text-muted-foreground">
              Apply for leaves, track approvals, and manage your time off efficiently.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Timesheet Tracking</h3>
            <p className="text-muted-foreground">
              Log your work hours, track projects, and submit timesheets with ease.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Secure Access</h3>
            <p className="text-muted-foreground">
              Role-based permissions ensure data security and appropriate access levels.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Admin Controls</h3>
            <p className="text-muted-foreground">
              Comprehensive admin panel for managing employees and approvals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
