import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { type CompanyFormData, COMPANY_SCHEMA } from "@/schema/company";
import { useForm, type SubmitHandler } from "react-hook-form";

interface CompanyFormProps {
  onSubmit: (data: CompanyFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<CompanyFormData> | null;
}

export const CompanyForm = ({
  onSubmit,
  loading,
  defaultValues,
}: CompanyFormProps) => {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(COMPANY_SCHEMA),
    defaultValues: {
      companyName: "",
      nooEmployees: 0,
      cNo: 0,
      computerCard: "",
      street: "",
      city: "",
      state: "",
      country: "India",
      phoneNo: "",
      ...defaultValues, // merge defaults safely
    },
  });

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit: SubmitHandler<CompanyFormData> = async (values) => {
    await onSubmit(values);
  };

  return (
    // ✅ Pass the *typed* form instance directly
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Sunway Technologies" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company No.</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1029834756"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nooEmployees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. of Employees</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="250"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Optional fields */}
          <FormField
            control={form.control}
            name="computerCard"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Computer Card</FormLabel>
                <FormControl>
                  <Input placeholder="CC-93847" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street</FormLabel>
                <FormControl>
                  <Input placeholder="Tech Avenue" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Kochi" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Kerala" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="India" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="9876543210" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Company"}
        </Button>
      </form>
    </Form>
  );
};
