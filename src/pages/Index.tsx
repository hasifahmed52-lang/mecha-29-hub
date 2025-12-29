import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { registrationSchema, RegistrationFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const Index = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      studentId: '',
      rollNumber: '',
      section: '',
      phoneNumber: '+880',
      presentAddress: '',
      permanentAddress: '',
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('registrations').insert({
        full_name: data.fullName,
        student_id: data.studentId,
        roll_number: data.rollNumber,
        section: data.section,
        blood_group: data.bloodGroup,
        phone_number: data.phoneNumber,
        present_address: data.presentAddress,
        permanent_address: data.permanentAddress,
        fee_paid: data.feePaid === 'yes',
      });

      if (error) throw error;

      setIsSuccess(true);
      form.reset();
      toast({
        title: 'Registration Successful!',
        description: 'Your registration has been submitted successfully.',
      });

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {/* Header */}
      <header className="max-w-2xl mx-auto mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
          <GraduationCap className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          AUST MECHA 29
        </h1>
        <p className="text-muted-foreground">Banner Opening Event Registration</p>
      </header>

      {/* Registration Card */}
      <main className="max-w-2xl mx-auto">
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 animate-slide-up">
          {isSuccess && (
            <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3 animate-scale-in">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <p className="text-success font-medium">
                Registration submitted successfully!
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Full Name (in English) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        className="input-focus"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Student ID & Roll Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your student ID"
                          className="input-focus"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your roll number"
                          className="input-focus"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section & Blood Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your section"
                          className="input-focus"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="input-focus">
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bloodGroups.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+8801XXXXXXXXX"
                        className="input-focus"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Present Address */}
              <FormField
                control={form.control}
                name="presentAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Present Address (in details) *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your current address in detail"
                        className="input-focus min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Permanent Address */}
              <FormField
                control={form.control}
                name="permanentAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permanent Address (in details) *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your permanent address in detail"
                        className="input-focus min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fee Paid */}
              <FormField
                control={form.control}
                name="feePaid"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Have you paid the fee for the event? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="fee-yes" />
                          <Label htmlFor="fee-yes" className="cursor-pointer">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="fee-no" />
                          <Label htmlFor="fee-no" className="cursor-pointer">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Admin Link */}
        <div className="mt-6 text-center animate-fade-in">
          <Link
            to="/admin"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
