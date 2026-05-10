import type { Route } from "./+types/home";
import { EREditor } from "../components/EREditor";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ER Maker — Chen Notation Editor" },
    { name: "description", content: "Conceptual ER diagram editor in Chen notation" },
  ];
}

export default function Home() {
  return <EREditor />;
}
