import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema";
import { useCustomerLogin } from "../hooks/useCustomerLogin";
import AuthCard from "./AuthCard";

export default function CustomerLoginForm() {
  const { login, submitting, error } = useCustomerLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <AuthCard
      title="Customer sign in"
      subtitle="Sign in to manage and track your laundry orders"
    >
      <form
        className="space-y-5"
        onSubmit={handleSubmit((values) => login(values))}
        noValidate
      >
        {error && (
          <div role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <label className="block text-sm font-medium text-slate-700">
          Email address
          <input
            type="email"
            autoComplete="email"
            className="mt-1.5 h-12 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            {...register("email")}
          />
          {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <span className="relative mt-1.5 block">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-12 w-full rounded-lg border border-slate-300 px-4 pr-12 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 text-slate-500"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </span>
          {errors.password && <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>}
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : "Sign in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        New customer?{" "}
        <Link className="font-semibold text-blue-600 hover:underline" to="/customer/register">Create an account</Link>
      </p>
      <p className="mt-3 text-center text-sm text-slate-500">
        Laundry owner or staff?{" "}
        <Link className="font-semibold text-blue-600 hover:underline" to="/login">Dashboard sign in</Link>
      </p>
    </AuthCard>
  );
}
