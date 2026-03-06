"use client";

import { Form, FormControl, FormField, FormItem, FormMessage, FormStateMessage } from "./form";
import type { NewsletterSchema } from "@/lib/schema";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterSchema } from "@/lib/schema";
import { subscribe } from "@/lib/subscribe";
import { useEffect, useState } from "react";
import { ActionResult, cn } from "@/lib/utils";
import { AlertTitle, alertVariants } from "./alert";
import { motion } from "framer-motion";

const CheckCircledIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
    <path d="M7.5 0.875C3.87778 0.875 0.875 3.87778 0.875 7.5C0.875 11.1222 3.87778 14.125 7.5 14.125C11.1222 14.125 14.125 11.1222 14.125 7.5C14.125 3.87778 11.1222 0.875 7.5 0.875ZM10.349 5.72402L6.72402 9.34902C6.62402 9.44902 6.47656 9.44902 6.37656 9.34902L4.65102 7.62402C4.45102 7.42402 4.15102 7.42402 3.95102 7.62402C3.75102 7.82402 3.75102 8.12402 3.95102 8.32402L6.475 10.848C6.775 11.148 7.275 11.148 7.575 10.848L11.049 7.37402C11.249 7.17402 11.249 6.87402 11.049 6.67402C10.849 6.47402 10.549 6.47402 10.349 6.67402L10.349 5.72402Z" fill="currentColor" />
  </svg>
);

const CrossCircledIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
    <path d="M7.5 0.875C3.87778 0.875 0.875 3.87778 0.875 7.5C0.875 11.1222 3.87778 14.125 7.5 14.125C11.1222 14.125 14.125 11.1222 14.125 7.5C14.125 3.87778 11.1222 0.875 7.5 0.875ZM9.72402 5.27598L8.77402 4.32598L7.5 5.59998L6.22402 4.32598L5.27402 5.27598L6.54902 6.54998L5.27402 7.82402L6.22402 8.77402L7.5 7.49902L8.77402 8.77402L9.72402 7.82402L8.44902 6.54998L9.72402 5.27598Z" fill="currentColor" />
  </svg>
);

const SPRING = {
  type: "spring" as const,
  stiffness: 130.40,
  damping: 14.50,
  mass: 1,
};

const SubmissionStateMessage = ({ value, reset }: { value: ActionResult<string> | null, reset: () => void }) => {
  const form = useFormContext<NewsletterSchema>();

  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      reset();
    }
  }, [form.formState.errors, reset]);
  
  return (
    <FormStateMessage>
      {value?.success === true && (
        <motion.div
          key={value.id}
          className={cn(
            alertVariants({ variant: "success" }),
            "absolute top-0 left-0 right-0 mx-auto w-max"
          )}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={SPRING}
        >
          <CheckCircledIcon />
          <AlertTitle>{value.data}</AlertTitle>
        </motion.div>
      )}
    </FormStateMessage>
  )
}

const getDefaultValues = () => {
  if (typeof window !== 'undefined') {
    const email = localStorage.getItem('email');
    return { email: email || '' };
  }

  return { email: '' };
}

export const FormNewsletter = ({
  input,
  submit,
}: {
  input: (props: React.ComponentProps<"input">) => React.ReactNode;
  submit: (props: React.ComponentProps<"button">) => React.ReactNode;
}) => {
  const [submissionState, setSubmissionState] =
    useState<ActionResult<string> | null>(null);

  const form = useForm<NewsletterSchema>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: getDefaultValues()
  });

  useEffect(() => {
    return () => {
      const v = form.getValues('email');

      if (v != undefined) {
        localStorage.setItem('email', v);
      }
    }
  }, [form]);

  async function onSubmit(values: NewsletterSchema) {
    const state = await subscribe(values.email);

    setSubmissionState(state);

    if (state.success === true) {
      form.reset({ email: '' });
    }

    if (state.success === false) {
      form.setError("email", { message: state.message });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative pt-10 lg:pt-12">
        <SubmissionStateMessage value={submissionState} reset={() => setSubmissionState(null)} />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormMessage>
                {(error) => (
                  <motion.div
                    key={error}
                    className={cn(
                      alertVariants({ variant: "destructive" }),
                      "absolute top-0 left-0 right-0 mx-auto w-max"
                    )}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={SPRING}
                  >
                    <CrossCircledIcon />
                    <AlertTitle>{error}</AlertTitle>
                  </motion.div>
                )}
              </FormMessage>
              <FormControl>
                <div className="relative">
                  {input({ ...field })}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    {submit({
                      type: "submit",
                      disabled: form.formState.isSubmitting,
                    })}
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
