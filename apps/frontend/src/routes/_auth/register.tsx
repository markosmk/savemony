import { useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import * as v from "valibot";

import { ButtonLoading } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/services/auth.hooks";

const searchSchema = v.object({
  ref: v.optional(v.string()), // ?ref=USER_ID
});

export const Route = createFileRoute("/_auth/register")({
  validateSearch: searchSchema,
  component: RegisterPage,
});

function RegisterPage() {
  const { ref: referredBy } = useSearch({ from: "/_auth/register" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { signUp } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signUp.mutate({ email, password, name, referredBy });
  };

  return (
    <div className="p-4">
      <h1 className="text-center text-2xl font-bold mb-4">Crear Cuenta</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input type="text" placeholder="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <ButtonLoading type="submit" isPending={signUp.isPending}>
          Registrarme
        </ButtonLoading>
      </form>

      {signUp.isError && <p style={{ color: "red" }}>Error: {signUp.error.message}</p>}

      {signUp.isSuccess && (
        <p style={{ color: "green" }}>
          ¡Cuenta creada! Revisá tu email o <Link to="/login">iniciá sesión</Link>.
        </p>
      )}

      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </div>
  );
}
