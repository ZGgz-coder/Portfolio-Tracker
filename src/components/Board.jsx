import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import Column from "./Column";
import TaskPreviewCard from "./TaskPreviewCard";

export default function Board({
  columns,
  onMove,
  onEdit,
  onDelete,
  dragDisabled,
  onDragStart,
  onDragCancel,
  onDragEnd,
  activeTask
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  return (
    <DndContext
      sensors={dragDisabled ? undefined : sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
    >
      <section className="kanban-grid" aria-label="Tablero Kanban">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            columns={columns}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
            dragDisabled={dragDisabled}
          />
        ))}
      </section>
      <DragOverlay>
        {activeTask && !dragDisabled ? <TaskPreviewCard title={activeTask.title} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
