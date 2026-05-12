import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  type NodeTypes,
  type Node,
  type Edge,
  type NodeChange,
  type XYPosition,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { demoDiagram } from "~/lib/demo-diagram";
import { erToFlow } from "~/lib/er-to-flow";
import { applyDagreLayout } from "~/lib/dagre-layout";
import { parseDbml } from "~/lib/dbml-parser";
import { parseSqlDdl } from "~/lib/sql-parser";
import { schemaToEr } from "~/lib/dbml-to-er";
import { erToDmbl } from "~/lib/er-to-dbml";
import { withToggleCallback } from "~/lib/with-toggle-callback";
import { promoteToAssociativeEntity } from "~/lib/er-promote";
import { useTheme } from "~/lib/useTheme";
import { EntityNode } from "~/components/er-nodes/EntityNode";
import { RelationshipNode } from "~/components/er-nodes/RelationshipNode";
import { AttributeNode } from "~/components/er-nodes/AttributeNode";
import { ErParticipantEdge } from "~/components/er-edges/ErParticipantEdge";
import { ErAttributeEdge } from "~/components/er-edges/ErAttributeEdge";
import { EditorToolbar } from "~/components/EditorToolbar";
import { EditorSidebar } from "~/components/EditorSidebar";
import { AIPromptPanel } from "~/components/AIPromptPanel";
import { SavedDiagramsPanel } from "~/components/SavedDiagramsPanel";
import type { SavedDiagram } from "~/store/diagramStore";
import type { ERDiagram } from "~/types/er-model";
import type { ImportFormat } from "~/components/SchemaImportPanel";

const nodeTypes: NodeTypes = {
  erEntity: EntityNode,
  erRelationship: RelationshipNode,
  erAttribute: AttributeNode,
};

const edgeTypes = {
  erParticipant: ErParticipantEdge,
  erAttribute: ErAttributeEdge,
};

const DEMO_DBML = `// Demo DBML — paste your own schema below
Table student {
  student_id int [pk]
  name varchar [not null]
  date_of_birth date
  age int [derived]
  phone varchar [multivalued]
}

Table course {
  course_code int [pk]
  title varchar [not null]
  credits int
}

Table enrollment {
  student_id int [not null]
  course_code int [not null]
  grade varchar
  semester varchar
}

Ref: enrollment.student_id > student.student_id [alias: "ENROLLS"]
Ref: enrollment.course_code > course.course_code
`;

const DEMO_SQL = `/* Demo SQL — paste your own DDL below */
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255)
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  body TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE tags (
  id INT PRIMARY KEY,
  label VARCHAR(255) NOT NULL
);

CREATE TABLE post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
`;

export function EREditor() {
  const { theme, toggleTheme } = useTheme();
  const [diagram, setDiagram] = useState<ERDiagram>(demoDiagram);
  const [nodePositions, setNodePositions] = useState<Map<string, XYPosition>>(new Map());
  const [importText, setImportText] = useState("");
  const [importPanelOpen, setImportPanelOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFormat, setImportFormat] = useState<ImportFormat>("dbml");
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);

  const [nodes, setNodes] = useState<Node[]>(() =>
    withToggleCallback(erToFlow(demoDiagram).nodes, () => {})
  );
  const [edges, setEdges] = useState<Edge[]>(erToFlow(demoDiagram).edges);

  const nodePositionsRef = useRef(nodePositions);
  nodePositionsRef.current = nodePositions;

  const handleHover = useCallback((relId: string) => setHoveredRelId(relId), []);
  const handleUnhover = useCallback(
    (relId: string) => setHoveredRelId((prev) => (prev === relId ? null : prev)),
    []
  );

  const toggleRelAttributes = useCallback(
    (relId: string) => {
      setDiagram((prev) => ({
        ...prev,
        relationships: prev.relationships.map((r) =>
          r.id === relId
            ? { ...r, attributesExpanded: !r.attributesExpanded }
            : r
        ),
      }));
    },
    []
  );

  const syncDiagram = useCallback(
    (nextDiagram: ERDiagram, positionOverrides?: Map<string, XYPosition>) => {
      const { nodes: projectedNodes, edges: projectedEdges } = erToFlow(nextDiagram);
      const merged = projectedNodes.map((node) => ({
        ...node,
        position: positionOverrides?.get(node.id) ?? nodePositionsRef.current.get(node.id) ?? node.position,
      }));
      setNodes(withToggleCallback(merged, toggleRelAttributes, handleHover, handleUnhover));
      setEdges(projectedEdges);
    },
    [setNodes, setEdges, toggleRelAttributes, handleHover, handleUnhover]
  );

  useEffect(() => {
    syncDiagram(diagram);
  }, [diagram, syncDiagram]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev));

    const positionUpdates = new Map<string, XYPosition>();
    for (const change of changes) {
      if (change.type === "position" && change.position) {
        positionUpdates.set(change.id, change.position);
      }
    }

    if (positionUpdates.size > 0) {
      setNodePositions((prev) => {
        const next = new Map(prev);
        for (const [id, pos] of positionUpdates) {
          next.set(id, pos);
        }
        return next;
      });
    }
  }, []);

  const handleAutoLayout = useCallback(() => {
    setNodes((prevNodes) => {
      const laid = applyDagreLayout(prevNodes, edges);
      // Sync new positions into nodePositions so drag overrides are cleared
      const newPositions = new Map<string, XYPosition>();
      for (const n of laid) {
        newPositions.set(n.id, n.position);
      }
      setNodePositions(newPositions);
      return withToggleCallback(laid, toggleRelAttributes, handleHover, handleUnhover);
    });
  }, [edges, toggleRelAttributes, handleHover, handleUnhover]);

  const highlightedEdges = useMemo<Edge[]>(
    () =>
      hoveredRelId
        ? edges.map((e) =>
            e.source === hoveredRelId || e.target === hoveredRelId
              ? { ...e, className: "highlighted" }
              : e
          )
        : edges,
    [edges, hoveredRelId]
  );

  const handleImport = useCallback((text?: string) => {
    const source = text ?? importText;
    console.log("handleImport called, importText length:", source.length, "first 50 chars:", source.slice(0, 50));
    try {
      let schema;
      if (importFormat === "dbml") {
        schema = parseDbml(source);
      } else {
        schema = parseSqlDdl(source);
      }
      console.log("parsed schema tables:", schema.tables.map(t => t.name));
      if (schema.tables.length === 0) {
        setImportError(
          importFormat === "dbml"
            ? "No tables found — check DBML syntax."
            : "No tables found — check SQL DDL syntax."
        );
        return;
      }
      const imported = schemaToEr(schema, importFormat);
      console.log("imported diagram relationships:", imported.relationships.map(r => r.name));
      setDiagram(imported);
      setImportError(null);
      setImportPanelOpen(false);
    } catch (err) {
      console.log("handleImport error:", err);
      setImportError(
        importFormat === "dbml"
          ? "Parse error — check DBML syntax."
          : "Parse error — check SQL DDL syntax."
      );
    }
  }, [importText, importFormat]);

  const handleResetDemo = useCallback(() => {
    setDiagram(demoDiagram);
    setImportPanelOpen(false);
    setImportError(null);
  }, []);

  const handleToggleImportPanel = useCallback(() => {
    setImportPanelOpen((v) => {
      if (!v) {
        setImportText(importFormat === "dbml" ? DEMO_DBML : DEMO_SQL);
      }
      return !v;
    });
    setImportError(null);
  }, [importFormat]);

  const handleFormatChange = useCallback(
    (format: ImportFormat) => {
      setImportFormat(format);
      setImportText(format === "dbml" ? DEMO_DBML : DEMO_SQL);
    },
    []
  );

  const promoteRelationship = useCallback(
    (relId: string) => {
      const promoted = promoteToAssociativeEntity(diagram, relId);
      if (promoted === diagram) return;
      setDiagram(promoted);
    },
    [diagram]
  );

  const handleLoadSaved = useCallback((snapshot: SavedDiagram) => {
    const positions = new Map(Object.entries(snapshot.nodePositions));
    setDiagram(snapshot.diagram);
    setNodePositions(positions);
    syncDiagram(snapshot.diagram, positions);
  }, [syncDiagram]);

  const handleCopyDbml = useCallback(() => {
    const dbml = erToDmbl(diagram);
    navigator.clipboard.writeText(dbml).catch(() => {});
  }, [diagram]);

  const selectedRel = diagram.relationships.find(
    (r) => r.participants.length > 1
  );

  return (
    <div className="flex h-screen w-screen bg-surface text-on-surface font-sans transition-colors duration-200">
      <EditorSidebar
        diagram={diagram}
        selectedRelationship={selectedRel}
        importPanelOpen={importPanelOpen}
        importText={importText}
        importError={importError}
        importFormat={importFormat}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleImportPanel={handleToggleImportPanel}
        onImportTextChange={setImportText}
        onImportFormatChange={handleFormatChange}
        onImport={handleImport}
        onResetDemo={handleResetDemo}
        onToggleAttributes={toggleRelAttributes}
        onPromoteRelationship={promoteRelationship}
      />

      {/* ── Main canvas ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        <EditorToolbar
          name={diagram.name}
          entityCount={diagram.entities.length}
          relationshipCount={diagram.relationships.length}
          onAIPromptClick={() => setAiPanelOpen(true)}
          onAutoLayout={handleAutoLayout}
          onSavedDiagrams={() => setSavedPanelOpen(true)}
          onCopyDbml={handleCopyDbml}
        />

        {/* React Flow canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={highlightedEdges}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ background: "var(--color-surface)" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--color-surface-container)"
            />
            <Controls
              style={{
                background: "var(--color-surface-container-low)",
                border: "1px solid var(--color-outline-variant)",
                borderRadius: 2,
              }}
            />
          </ReactFlow>
        </div>
      </main>

      <AIPromptPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />

      <SavedDiagramsPanel
        open={savedPanelOpen}
        currentDiagram={diagram}
        currentPositions={nodePositions}
        onLoad={handleLoadSaved}
        onClose={() => setSavedPanelOpen(false)}
      />
    </div>
  );
}
