import { useState, useMemo } from 'react';
import { Search, Eye, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Registration } from '@/pages/AdminDashboard';
import { Badge } from '@/components/ui/badge';

interface RegistrationTableProps {
  registrations: Registration[];
  onView: (registration: Registration) => void;
  onDelete: (id: string) => void;
}

const RegistrationTable = ({ registrations, onView, onDelete }: RegistrationTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [feeFilter, setFeeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique sections for filter
  const sections = useMemo(() => {
    const uniqueSections = [...new Set(registrations.map((r) => r.section.toUpperCase()))];
    return uniqueSections.sort();
  }, [registrations]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = [...registrations];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (r) =>
          r.full_name.toLowerCase().includes(term) ||
          r.student_id.toLowerCase().includes(term) ||
          r.roll_number.toLowerCase().includes(term)
      );
    }

    // Section filter
    if (sectionFilter !== 'all') {
      data = data.filter((r) => r.section.toUpperCase() === sectionFilter);
    }

    // Fee filter
    if (feeFilter !== 'all') {
      const feePaid = feeFilter === 'paid';
      data = data.filter((r) => r.fee_paid === feePaid);
    }

    // Sort by date
    data.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return data;
  }, [registrations, searchTerm, sectionFilter, feeFilter, sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden animate-slide-up">
      {/* Filters */}
      <div className="p-4 border-b border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Registrations</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, student ID, or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-focus"
            />
          </div>

          {/* Section Filter */}
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section} value={section}>
                  Section {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Fee Filter */}
          <Select value={feeFilter} onValueChange={setFeeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Fee Paid</SelectItem>
              <SelectItem value="notpaid">Fee Not Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Roll</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Fee Paid</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={toggleSort}
              >
                <div className="flex items-center gap-1">
                  Time
                  {sortOrder === 'desc' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No registrations found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((registration) => (
                <TableRow
                  key={registration.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onView(registration)}
                >
                  <TableCell className="font-medium">{registration.full_name}</TableCell>
                  <TableCell>{registration.student_id}</TableCell>
                  <TableCell>{registration.roll_number}</TableCell>
                  <TableCell>{registration.section}</TableCell>
                  <TableCell>{registration.phone_number}</TableCell>
                  <TableCell>
                    <Badge variant={registration.fee_paid ? 'default' : 'destructive'}>
                      {registration.fee_paid ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(registration.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(registration)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Registration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the registration for{' '}
                              <strong>{registration.full_name}</strong>? This action cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(registration.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border text-sm text-muted-foreground">
        Showing {filteredData.length} of {registrations.length} registrations
      </div>
    </div>
  );
};

export default RegistrationTable;
