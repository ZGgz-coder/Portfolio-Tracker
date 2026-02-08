import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function formatDueDate(value) {
  if (!value) {
    return "";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export default function TaskCard({ task, columns, onMove, onEdit, onDelete, dragDisabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: dragDisabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card${isDragging ? " dragging" : ""}${dragDisabled ? " drag-disabled" : ""}`}
      {...attributes}
      {...listeners}
    >
      <p>{task.title}</p>

      <div className="task-meta">
        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
        {task.dueDate ? <span className="due-chip">Due {formatDueDate(task.dueDate)}</span> : null}
      </div>

      {task.tags.length > 0 ? (
        <div className="tag-row">
          {task.tags.map((tag) => (
            <span key={`${task.id}-${tag}`} className="tag-chip">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="task-actions">
        <select
          value={task.columnId}
          onChange={(event) => onMove(task.id, event.target.value)}
          aria-label={`Mover ${task.title}`}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {columns.map((target) => (
            <option key={target.id} value={target.id}>
              {target.title}
            </option>
          ))}
        </select>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onEdit(task.id)}>
          Editar
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDelete(task.id)}
          className="danger"
        >
          Borrar
        </button>
      </div>
    </article>
  );
}
