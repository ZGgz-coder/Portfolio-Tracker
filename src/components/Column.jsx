import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function Column({ column, columns, onMove, onEdit, onDelete, dragDisabled }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled: dragDisabled });

  return (
    <section ref={setNodeRef} className={`kanban-column${isOver ? " drop-target" : ""}`}>
      <header className="column-head">
        <h2>{column.title}</h2>
        <span>{column.tasks.length}</span>
      </header>

      <SortableContext
        items={column.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="column-list">
          {column.tasks.length === 0 ? (
            <p className="empty-state">Suelta una tarea aqui.</p>
          ) : (
            column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
              columns={columns}
              onMove={onMove}
              onEdit={onEdit}
              onDelete={onDelete}
              dragDisabled={dragDisabled}
            />
          ))
        )}
        </div>
      </SortableContext>
    </section>
  );
}
