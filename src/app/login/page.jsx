'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [recuerdame, setRecuerdame] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Cargar correo guardado si existe
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setCorreo(savedEmail);
      setRecuerdame(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Guardar información del participante e inscripciones si están disponibles
      if (data.participante) {
        localStorage.setItem('participante_id', data.participante.id);
        localStorage.setItem('participante', JSON.stringify(data.participante));
      }
      
      if (data.inscripciones) {
        localStorage.setItem('mis_inscripciones', JSON.stringify(data.inscripciones));
      }
      
      // Guardar o eliminar correo según "Recuérdame"
      if (recuerdame) {
        localStorage.setItem('rememberedEmail', correo);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      setMensaje("✅ Inicio de sesión exitoso");

      // Verificar si hay una URL de retorno guardada
      const returnUrl = localStorage.getItem('returnUrl');
      
      if (returnUrl) {
        // Limpiar la URL de retorno
        localStorage.removeItem('returnUrl');
        // Redirigir a la URL guardada
        router.push(returnUrl);
      } else {
        // Redirigir según rol
        if (data.user.rol === "admin") {
          router.push("/admin/panel");
        } else {
          // Si es usuario normal y viene de login directo, ir a Mi Perfil
          router.push("/mi-perfil");
        }
      }
    } else {
      setMensaje(`❌ ${data.error}`);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Iniciar Sesión</h1>
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
        <div>
          <label className="block mb-1 font-medium">Correo electrónico</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            autoComplete="email"
            className="w-full border-gray-300 rounded p-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full border-gray-300 rounded p-2"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="recuerdame"
            checked={recuerdame}
            onChange={(e) => setRecuerdame(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="recuerdame" className="text-sm text-gray-700">
            Recuérdame
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
        >
          Iniciar sesión
        </button>
      </form>

      {mensaje && <p className="text-center mt-4 text-blue-700">{mensaje}</p>}
    </div>
  );
}
