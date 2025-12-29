import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Registration } from '@/pages/AdminDashboard';

interface RegistrationDetailModalProps {
  registration: Registration | null;
  onClose: () => void;
}

const RegistrationDetailModal = ({ registration, onClose }: RegistrationDetailModalProps) => {
  if (!registration) return null;

  const fields = [
    { label: 'Full Name', value: registration.full_name },
    { label: 'Student ID', value: registration.student_id },
    { label: 'Roll Number', value: registration.roll_number },
    { label: 'Section', value: registration.section },
    { label: 'Blood Group', value: registration.blood_group },
    { label: 'Phone Number', value: registration.phone_number },
    { label: 'Present Address', value: registration.present_address },
    { label: 'Permanent Address', value: registration.permanent_address },
    {
      label: 'Fee Paid',
      value: (
        <Badge variant={registration.fee_paid ? 'default' : 'destructive'}>
          {registration.fee_paid ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      label: 'Submission Date',
      value: new Date(registration.created_at).toLocaleString(),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Registration Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
              <div className="text-foreground">{field.value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationDetailModal;
