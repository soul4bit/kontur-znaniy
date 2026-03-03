"use client";

import { type ChangeEventHandler, useState } from "react";
import { Eye, EyeOff, KeyRound, Mail, User, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

type FieldLabelProps = {
  htmlFor: string;
  label: string;
};

type TextFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  type?: "text" | "email";
  required?: boolean;
  icon?: LucideIcon;
};

type PasswordFieldProps = {
  id: string;
  label?: string;
  placeholder: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  required?: boolean;
};

type BotTrapProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

const iconMap = {
  email: Mail,
  user: User,
} as const;

function FieldLabel({ htmlFor, label }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-muted-foreground">
      {label}
    </label>
  );
}

export function TextField({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
  type = "text",
  required = false,
  icon,
}: TextFieldProps) {
  const Icon = icon ?? (type === "email" ? iconMap.email : iconMap.user);

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} label={label} />
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="pl-10"
        />
      </div>
    </div>
  );
}

export function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
  required = false,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      {label ? <FieldLabel htmlFor={id} label={label} /> : null}
      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="pl-10 pr-11"
        />
        <button
          type="button"
          onClick={() => setShowPassword((currentValue) => !currentValue)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function BotTrap({ value, onChange }: BotTrapProps) {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0"
      value={value}
      onChange={onChange}
    />
  );
}
