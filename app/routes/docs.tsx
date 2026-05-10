import type { Route } from "./+types/docs";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Documentación — ER Maker" },
    { name: "description", content: "Documentación de ER Maker" },
  ];
}

function DocsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-on-surface tracking-[-0.01em] mb-3">
        {title}
      </h2>
      <div className="text-xs text-on-surface-variant leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1 py-0.5 bg-surface-container-low rounded-sm text-on-surface text-2xs font-mono">
      {children}
    </code>
  );
}

export default function Docs() {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-base-er font-semibold tracking-[-0.02em]">
            Documentación de ER Maker
          </h1>
          <Link
            to="/"
            className="text-2xs text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
          >
            ← Volver al editor
          </Link>
        </div>

        <DocsSection title="Cómo usar">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong className="text-on-surface">Importar DBML o SQL</strong>{" "}
              — Haz click en{" "}
              <em>Importar Esquema</em> en la barra lateral, pega tu esquema
              DBML o SQL DDL y presiona <em>Cargar al Canvas</em>.
            </li>
            <li>
              <strong className="text-on-surface">
                Editar el diagrama
              </strong>{" "}
              — Arrastra las entidades para reorganizar el diagrama. Pasa el
              mouse sobre una relación para resaltarla.
            </li>
            <li>
              <strong className="text-on-surface">
                Expandir atributos de relación
              </strong>{" "}
              — Las relaciones N:M muestran un botón{" "}
              <em>+ ATRIB</em>. Haz click para ver los atributos de la
              relación.
            </li>
            <li>
              <strong className="text-on-surface">
                Promover a entidad asociativa
              </strong>{" "}
              — En el panel de detalle N:M, haz click en{" "}
              <em>Promover a Entidad</em> para convertir la relación en una
              entidad independiente.
            </li>
          </ol>
        </DocsSection>

        <DocsSection title="Sintaxis DBML Extendida">
          <p>
            ER Maker extiende DBML estándar con alias conceptuales para
            tablas puente y relaciones.
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <h3 className="text-2xs font-medium text-on-surface uppercase tracking-[0.04em] mb-1">
                Alias de tablas N:M
              </h3>
              <p>
                Asigna un nombre conceptual a una tabla puente usando{" "}
                <Code>alias</Code>:
              </p>
              <pre className="mt-1.5 p-2.5 bg-surface-inset border border-outline-variant rounded-sm text-2xs font-mono leading-relaxed overflow-x-auto">
{`Table enrollments [alias: "INSCRIBE"] {
  student_id int [not null]
  course_id  int [not null]
}`}
              </pre>
              <p className="mt-1 text-outline">
                → Crea la relación <em>INSCRIBE</em> en vez de ENROLLMENTS.
              </p>
            </div>

            <div>
              <h3 className="text-2xs font-medium text-on-surface uppercase tracking-[0.04em] mb-1">
                Alias de relaciones 1:N
              </h3>
              <p>
                Define el verbo de negocio de una relación directa usando{" "}
                <Code>alias</Code>:
              </p>
              <pre className="mt-1.5 p-2.5 bg-surface-inset border border-outline-variant rounded-sm text-2xs font-mono leading-relaxed overflow-x-auto">
{`Ref: posts.user_id > users.id [alias: "ESCRIBE"]`}
              </pre>
              <p className="mt-1 text-outline">
                → Crea la relación <em>ESCRIBE</em> entre POSTS y USERS.
              </p>
            </div>
          </div>
        </DocsSection>

        <DocsSection title="Atajos">
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-on-surface">Arrastrar nodos</strong>{" "}
              — Click y arrastra cualquier entidad o relación para moverla.
            </li>
            <li>
              <strong className="text-on-surface">Zoom</strong> — Usa la rueda
              del mouse o los controles de zoom en la esquina inferior
              izquierda.
            </li>
            <li>
              <strong className="text-on-surface">Pan</strong> — Click y
              arrastra en el fondo del canvas.
            </li>
          </ul>
        </DocsSection>

        <DocsSection title="FAQ">
          <div className="space-y-3">
            <details className="group">
              <summary className="cursor-pointer text-on-surface font-medium list-none flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-primary rounded-sm">
                <span className="transition-transform group-open:rotate-90 text-outline">
                  ▶
                </span>
                ¿Por qué mi tabla desapareció?
              </summary>
              <p className="mt-1.5 pl-5">
                Probablemente es una tabla puente N:M (dos columnas de
                referencia, sin clave primaria propia). ER Maker la detecta y
                la convierte en una <em>relación</em> del diagrama conceptual
                en vez de una entidad.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer text-on-surface font-medium list-none flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-primary rounded-sm">
                <span className="transition-transform group-open:rotate-90 text-outline">
                  ▶
                </span>
                ¿Cómo expando atributos de relación?
              </summary>
              <p className="mt-1.5 pl-5">
                En el canvas, busca el botón{" "}
                <em>+ ATRIB</em> dentro del rombo de la relación N:M. Haz
                click para mostrar u ocultar sus atributos.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer text-on-surface font-medium list-none flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-primary rounded-sm">
                <span className="transition-transform group-open:rotate-90 text-outline">
                  ▶
                </span>
                ¿Cómo uso la IA para generar un esquema?
              </summary>
              <p className="mt-1.5 pl-5">
                Haz click en el icono ✨ en la barra superior del editor. Se
                abrirá un panel con un prompt pre-escrito. Copia el prompt,
                pégalo en ChatGPT o Claude, y pega el DBML resultante en el
                importador.
              </p>
            </details>
          </div>
        </DocsSection>
      </div>
    </div>
  );
}
