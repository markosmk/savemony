import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ButtonLoading } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/services/auth.hooks";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    signIn.mutate({ email, password });
  };

  return (
    <div className=" max-w-sm mx-auto">
      <h1 className="text-center text-2xl font-bold mb-4">Iniciar Sesión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <ButtonLoading type="submit" isPending={signIn.isPending}>
          Entrar
        </ButtonLoading>
      </form>

      {signIn.isError && <p style={{ color: "red" }}>Error: {signIn.error.message}</p>}

      <p>
        ¿No tenés cuenta? <Link to="/register">Registrate</Link>
      </p>
    </div>
  );
}
