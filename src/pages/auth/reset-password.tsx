import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword) {
      toast.error("Please provide both old and new passwords");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await apiClient.put("/auth/change-password", {
        oldPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Reset password failed:", err?.response?.data ?? err);
      const msg = err?.response?.data?.message || err?.message || "Failed to change password";
      toast.error(String(msg));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm">Old Password</label>
          <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">New Password</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Confirm New Password</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Change Password</Button>
        </div>
      </div>
    </div>
  );
}
