import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LeaveCustomizationForm from "@/modules/hr/leaves/admin/LeaveCustomizationForm";

export default function LeaveCustomizationPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">Leave Customization</h1>
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manage Leave Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Configure leave allowances for different employee roles. Set the number of days allowed for each leave type per role to customize leave management according to your organization's policies.
          </p>
        </CardContent>
      </Card>

      {/* Form */}
      <LeaveCustomizationForm />
    </div>
  );
}
