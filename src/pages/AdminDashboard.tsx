import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, CheckCircle, XCircle, LogOut, Download, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import StatsCard from '@/components/admin/StatsCard';
import RegistrationTable from '@/components/admin/RegistrationTable';
import ChartSection from '@/components/admin/ChartSection';
import RegistrationDetailModal from '@/components/admin/RegistrationDetailModal';

export interface Registration {
  id: string;
  full_name: string;
  student_id: string;
  roll_number: string;
  section: string;
  blood_group: string;
  phone_number: string;
  present_address: string;
  permanent_address: string;
  fee_paid: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const { isAdmin, isLoading, logout, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchRegistrations();

      // Subscribe to realtime changes
      const channel = supabase
        .channel('registrations-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registrations',
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setRegistrations((prev) => [payload.new as Registration, ...prev]);
              toast({
                title: 'New Registration',
                description: `${(payload.new as Registration).full_name} just registered!`,
              });
            } else if (payload.eventType === 'DELETE') {
              setRegistrations((prev) => prev.filter((r) => r.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setRegistrations((prev) =>
                prev.map((r) => (r.id === payload.new.id ? (payload.new as Registration) : r))
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, toast]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load registrations.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: 'Deleted',
        description: 'Registration has been deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete registration.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const exportToCSV = () => {
    const headers = [
      'Full Name',
      'Student ID',
      'Roll Number',
      'Section',
      'Blood Group',
      'Phone Number',
      'Present Address',
      'Permanent Address',
      'Fee Paid',
      'Submission Date & Time',
    ];

    const csvContent = [
      headers.join(','),
      ...registrations.map((r) =>
        [
          `"${r.full_name}"`,
          `"${r.student_id}"`,
          `"${r.roll_number}"`,
          `"${r.section}"`,
          `"${r.blood_group}"`,
          `"${r.phone_number}"`,
          `"${r.present_address.replace(/"/g, '""')}"`,
          `"${r.permanent_address.replace(/"/g, '""')}"`,
          r.fee_paid ? 'Yes' : 'No',
          new Date(r.created_at).toLocaleString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV Downloaded',
      description: 'Registration data has been exported successfully.',
    });
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalRegistrations = registrations.length;
  const totalFeePaid = registrations.filter((r) => r.fee_paid).length;
  const totalFeeNotPaid = registrations.filter((r) => !r.fee_paid).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-lg md:text-xl font-bold">AUST MECHA 29 Admin</h1>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="gold"
                size="sm"
                onClick={exportToCSV}
                disabled={registrations.length === 0}
              >
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-primary-foreground/20">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => {
                  exportToCSV();
                  setIsMobileMenuOpen(false);
                }}
                disabled={registrations.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Total Registrations"
                value={totalRegistrations}
                icon={Users}
                color="primary"
              />
              <StatsCard
                title="Fee Paid"
                value={totalFeePaid}
                icon={CheckCircle}
                color="success"
              />
              <StatsCard
                title="Fee Not Paid"
                value={totalFeeNotPaid}
                icon={XCircle}
                color="destructive"
              />
            </div>

            {/* Charts */}
            <ChartSection registrations={registrations} />

            {/* Data Table */}
            <RegistrationTable
              registrations={registrations}
              onView={setSelectedRegistration}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <RegistrationDetailModal
        registration={selectedRegistration}
        onClose={() => setSelectedRegistration(null)}
      />
    </div>
  );
};

export default AdminDashboard;
