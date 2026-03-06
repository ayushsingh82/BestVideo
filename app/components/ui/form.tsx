"use client";

import * as React from "react";
import {
  FormProvider,
  useFormContext,
  Controller,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
  type ControllerProps,
} from "react-hook-form";
import { cn } from "@/lib/utils";

type FormProps<T extends FieldValues> = {
  children: React.ReactNode;
} & UseFormReturn<T>;

export function Form<T extends FieldValues>(props: FormProps<T>) {
  const { children, ...methods } = props;
  return <FormProvider {...(methods as UseFormReturn<T>)}>{children}</FormProvider>;
}

const FormFieldContext = React.createContext<{ error?: string }>({});

type FormFieldContextValue = {
  name: FieldPath<FieldValues>;
};

const FormFieldInnerContext = React.createContext<FormFieldContextValue | null>(null);

type FormFieldProps<T extends FieldValues> = Omit<
  ControllerProps<T>,
  "render"
> & {
  render: ControllerProps<T>["render"];
};

export function FormField<T extends FieldValues>({
  control,
  name,
  render,
  ...rest
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={(props) => (
        <FormFieldInnerContext.Provider value={{ name: name as FieldPath<FieldValues> }}>
          <FormFieldContext.Provider
            value={{ error: props.fieldState.error?.message }}
          >
            {render(props)}
          </FormFieldContext.Provider>
        </FormFieldInnerContext.Provider>
      )}
      {...rest}
    />
  );
}

export function FormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FormControl({
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

export function FormMessage({
  children,
}: {
  children: (error: string | undefined) => React.ReactNode;
}) {
  const { error } = React.useContext(FormFieldContext);
  return <>{children(error)}</>;
}

export function FormStateMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function useFormField() {
  const context = React.useContext(FormFieldInnerContext);
  const fieldContext = React.useContext(FormFieldContext);
  const { getFieldState, formState } = useFormContext();

  if (!context) return { name: undefined, error: undefined };

  const fieldState = getFieldState(context.name, formState);
  return {
    name: context.name,
    error: fieldState.error?.message ?? fieldContext?.error,
  };
}
