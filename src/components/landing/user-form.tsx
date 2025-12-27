"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type {
  User,
  ServerActionResponse,
  Batch,
  UserFormResult,
} from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

// Updated schema to handle both create and edit
const formSchema = z.object({
  name: z.string().min(2, {
    message: "নাম কমপক্ষে ২টি অক্ষরের হতে হবে।",
  }),
  roll: z.string().min(1, {
    message: "রোল নম্বর আবশ্যক।",
  }),
  pass: z.string().optional(),
  batch_id: z.string().optional(),
  passwordMode: z.enum(["auto", "manual"]).optional(),
});

type UserFormValues = z.infer<typeof formSchema>;

type UserFormProps = {
  defaultValues: Partial<User> | null;
  action: (formData: FormData) => Promise<ServerActionResponse>;
  onSuccess: (data?: User | UserFormResult | null) => void;
  isCreateMode?: boolean;
  batches?: Batch[];
};

export function UserForm({
  defaultValues,
  action,
  onSuccess,
  isCreateMode = false,
  batches = [],
}: UserFormProps) {
  const [passwordMode, setPasswordMode] = useState<"auto" | "manual">("auto");

  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      isCreateMode
        ? formSchema.pick({ name: true, roll: true, batch_id: true, passwordMode: true })
        : formSchema.extend({
            pass: z
              .string()
              .min(4, { message: "পাসওয়ার্ড কমপক্ষে ৪টি অক্ষরের হতে হবে।" }),
          }),
    ),
    defaultValues: {
      name: defaultValues?.name || "",
      roll: defaultValues?.roll || "",
      pass: "",
      batch_id: "",
      passwordMode: "auto",
    },
  });

  const { formState, handleSubmit } = form;

  const handleFormSubmit = async (values: UserFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("roll", values.roll || "");

    if (isCreateMode) {
      if (values.batch_id) {
        formData.append("batch_id", values.batch_id);
      }
      // Pass password mode to action
      formData.append("passwordMode", passwordMode);
      if (passwordMode === "manual") {
        formData.append("pass", values.pass || "");
      }
    } else {
      formData.append("pass", values.pass || "");
      if (defaultValues?.uid) {
        formData.append("uid", defaultValues.uid);
      }
    }

    const result = await action(formData);

    if (result?.success) {
      onSuccess(result.data as User | UserFormResult | null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>নাম</FormLabel>
              <FormControl>
                <Input
                  placeholder="ব্যবহারকারীর নাম"
                  {...field}
                  disabled={formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isCreateMode && (
          <FormField
            control={form.control}
            name="roll"
            render={({ field }) => (
              <FormItem>
                <FormLabel>রোল নম্বর</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ব্যবহারকারীর রোল নম্বর"
                    {...field}
                    disabled={formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {isCreateMode && (
          <FormField
            control={form.control}
            name="batch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ব্যাচ (ঐচ্ছিক)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={formState.isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="ভর্তি করার জন্য একটি ব্যাচ নির্বাচন করুন" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {isCreateMode && (
          <FormItem>
            <FormLabel>পাসওয়ার্ড মোড</FormLabel>
            <FormControl>
              <RadioGroup
                value={passwordMode}
                onValueChange={(value) => {
                  setPasswordMode(value as "auto" | "manual");
                  form.setValue("passwordMode", value as "auto" | "manual");
                }}
                disabled={formState.isSubmitting}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="mode-auto" />
                  <label htmlFor="mode-auto" className="cursor-pointer">
                    স্বয়ংক্রিয় তৈরি (সুপারিশকৃত)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="mode-manual" />
                  <label htmlFor="mode-manual" className="cursor-pointer">
                    ম্যানুয়াল প্রবেশ
                  </label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
        {isCreateMode && passwordMode === "manual" && (
          <FormField
            control={form.control}
            name="pass"
            render={({ field }) => (
              <FormItem>
                <FormLabel>পাসওয়ার্ড</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="ব্যবহারকারীর পাসওয়ার্ড"
                    {...field}
                    disabled={formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {!isCreateMode && (
          <>
            <FormField
              control={form.control}
              name="roll"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>রোল নম্বর</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="রোল নম্বর"
                      {...field}
                      disabled={formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>পাসওয়ার্ড</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="নতুন পাসওয়ার্ড"
                      {...field}
                      disabled={formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "সংরক্ষণ করা হচ্ছে..." : "সংরক্ষণ করুন"}
        </Button>
      </form>
    </Form>
  );
}
