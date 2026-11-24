import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../api/auth.api";
import {
  registrationSchema,
  type RegistrationFormValues,
} from "../schemas/registrationSchema";
import AuthCard from "./AuthCard";

type Props = { owner?: boolean };

export default function RegistrationForm({ owner = false }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      telephone: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegistrationFormValues) => {
    setError(null);
    setSubmitting(true);
    const { confirmPassword, ...user } = values;
    try {
      if (owner) {
        await authApi.registerOwner(user);
      } else {
        await authApi.register(user);
      }
      toast.success(owner ? "Owner account created. You can now sign in." : "Customer account created. You can now sign in.");
      navigate(owner ? "/login" : "/customer/login", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const errorText = (message?: string) =>
    message ? <span className="mt-1 block text-xs text-red-600">{message}</span> : null;

  return (
    <AuthCard
      title={owner ? "Owner registration" : "Create customer account"}
      subtitle={
        owner
          ? "Register the initial owner account for the laundry dashboard."
          : "Register to place and track your laundry orders"
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <div role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <label className="block text-sm font-medium text-slate-700">
          Full name
          <input autoComplete="name" className={inputClass} {...register("name")} />
          {errorText(errors.name?.message)}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email address
          <input type="email" autoComplete="email" className={inputClass} {...register("email")} />
          {errorText(errors.email?.message)}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Mobile number
          <input type="tel" autoComplete="tel" inputMode="tel" placeholder="09XXXXXXXXX or 07XXXXXXXX" className={inputClass} {...register("telephone")} />
          {errorText(errors.telephone?.message)}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <span className="relative mt-1.5 block">
            <input type={showPassword ? "text" : "password"} autoComplete="new-password" className={`${inputClass} pr-12`} {...register("password")} />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-3 text-slate-500">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {errorText(errors.password?.message)}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Confirm password
          <span className="relative mt-1.5 block">
            <input type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" className={`${inputClass} pr-12`} {...register("confirmPassword")} />
            <button type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword((value) => !value)} className="absolute inset-y-0 right-3 text-slate-500">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {errorText(errors.confirmPassword?.message)}
        </label>
        <button type="submit" disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : owner ? "Create owner account" : "Create customer account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link className="font-semibold text-blue-600 hover:underline" to={owner ? "/login" : "/customer/login"}>
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
