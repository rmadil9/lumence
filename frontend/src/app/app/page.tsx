import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { TodoPanel } from "@/components/todos/TodoPanel";
import { WritingPanel } from "@/components/writing/WritingPanel";

export default function WorkspacePage() {
  return <WorkspaceShell tasksPanel={<TodoPanel />} writePanel={<WritingPanel />} />;
}
