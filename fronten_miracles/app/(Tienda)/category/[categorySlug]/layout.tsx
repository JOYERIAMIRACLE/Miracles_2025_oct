import type { Metadata } from "next";

// 1. Esta función sustituye al objeto metadata estático
export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params
  const slug = categorySlug ?? "";

  // Formateamos el texto: quitamos guiones y ponemos la primera letra en mayúscula
  // Ej: "anillos-de-oro" -> "Anillos De Oro"
  const categoryName = slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `Categoría ${categoryName}`, // Esto se enviará al %s del Root Layout
    description: `Explora nuestra exclusiva colección de ${categoryName} en Joyería Miracles. Oro de 14k y Plata 925.`,
  };
}

export default function CategoriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}