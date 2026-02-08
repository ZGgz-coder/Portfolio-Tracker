export default function TaskModal({
  form,
  isOpen,
  priorityOptions,
  errorMessage,
  onChange,
  onClose,
  onSave
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Editar tarea"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Editar tarea</h3>
        <form className="modal-form" onSubmit={onSave}>
          <label>
            Titulo
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="Titulo de la tarea"
            />
          </label>

          <label>
            Prioridad
            <select
              value={form.priority}
              onChange={(event) => onChange({ priority: event.target.value })}
            >
              {priorityOptions.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fecha limite
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => onChange({ dueDate: event.target.value })}
            />
          </label>

          <label>
            Tags (coma)
            <input
              type="text"
              value={form.tags}
              onChange={(event) => onChange({ tags: event.target.value })}
              placeholder="frontend, api"
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit">Guardar</button>
          </div>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        </form>
      </section>
    </div>
  );
}
