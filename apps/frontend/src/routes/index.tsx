import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div className="flex h-screen items-center justify-center">
			<div className="flex items-center gap-4">
				<Link to="/login">Iniciar sesión</Link>
				<Link to="/register">Crear cuenta</Link>
			</div>
		</div>
	);
}
