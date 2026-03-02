# UI Manual QA Checklist — FactuApp (Phase G)

Run after every frontend change. Start the dev server with `python scripts/start_dev.py` and open `http://127.0.0.1:8000`.

---

## Flow 1 — Create invoice (Manual) → Officialize → Export PDF

1. Click **Nueva factura**. Verify the **Automática** card is selected by default (not Manual).
2. Click the **Manual** card to switch mode. Verify the lines table appears.
3. Add a client via **+ Nuevo** modal or select an existing one from the dropdown.
4. Add at least one line (description, quantity, price). Click **Guardar borrador**.
5. Verify the summary view shows with status badge **Borrador** (Spanish).
6. Click **Oficializar**. Verify:
   - Toast appears: "Factura oficializada: YYYY/NNN"
   - Status badge changes to **Oficial** (Spanish).
   - The `#official-number` strip appears with the official code.
   - No persistent banner remains.
7. Click **PDF**. Verify toast "Exportación PDF completada" appears. No lingering banner.

---

## Flow 2 — Create invoice via Texto libre (IA) → Officialize → Export Excel

1. Click **Nueva factura**. Confirm **Automática** is pre-selected.
2. Enter free-text in the textarea, e.g.:
   `Instalación split x 2 @ 450,00 / Mantenimiento x 1 @ 120`
3. Click **Interpretar y crear factura**. Button shows "Cargando..." during request.
4. Verify the summary view loads with interpreted lines.
5. If the backend returned a `client_hint`, verify a toast appears ~2.5 s after the creation toast saying "Cliente detectado: … — selecciónalo si procede."
6. Click **Oficializar** → then **Excel**. Verify toast for each. No persistent banner.

---

## Flow 3 — Create client → Attach to invoice

1. Navigate to **Clientes** tab. Verify banner clears when switching tabs.
2. Click **+ Nuevo cliente**, fill in Nombre + CIF. Click **Guardar cliente**.
3. Verify toast "Cliente creado" and client appears in table.
4. Click **Editar** on any client, change a field, click **Actualizar cliente**.
5. Navigate to **Facturas** → **Nueva factura** → search for the new client in the dropdown.

---

## Flow 4 — History filters (by status, year, client)

1. Navigate to **Historico** tab.
2. Verify filter dropdown options show **Borrador / Oficial / Especial** in Spanish.
3. Select "Oficial" and click **Aplicar**. Verify only official invoices appear.
4. Clear filters, select a year, apply. Verify correct year results.
5. Select a client and apply. Verify correct results.
6. Click **Limpiar** and verify all invoices return.
7. Click a row's **Ver** / **Continuar** button. Verify invoice opens in summary view.

---

## Flow 5 — Error paths

### 5a — 409 Integrity violation
1. Simulate by editing the DB hash field for an OFFICIAL invoice.
2. Attempt export. Verify:
   - Error message is in **Spanish**: "Se detectó una posible manipulación de datos..."
   - **Not** the raw English backend message.
   - Banner auto-dismisses after 7 seconds.

### 5b — 503 Export unavailable
1. Simulate by making the export folder inaccessible (rename it).
2. Attempt export. Verify:
   - **Warning** banner (amber) in Spanish: "No se pudo exportar (carpeta inaccesible...)..."
   - Invoice status remains **Oficial** (not reverted).
   - Banner auto-dismisses after 7 seconds.

### 5c — Officialize validation error
1. Open a DRAFT invoice and remove all lines (if editable).
2. Click **Oficializar**. Verify:
   - Inline error appears **below** the Oficializar button (`.action-error`).
   - The global banner does **not** appear.
   - Navigating back to list hides the inline error.

### 5d — Banner dismiss button
1. Trigger any error (e.g., try to interpret empty textarea).
2. Click the **×** button in the banner. Verify banner hides immediately.

### 5e — Navigation clears banner
1. Trigger any error banner.
2. Click **Clientes** in the sidebar. Verify banner clears.
3. Click **Facturas**. Navigate to create view. Verify still clear.

---

## Flow 6 — Network timeout simulation

1. Open Chrome DevTools → Network tab → set throttle to **Offline**.
2. Click **Interpretar y crear factura** (with text in the field).
3. Wait ~12 seconds. Verify:
   - Button shows "Cargando..." during wait.
   - After abort, a Spanish error appears: "La solicitud tardó demasiado. Comprueba la conexión..."
   - Button returns to "Interpretar y crear factura".
4. Restore network to **No throttling**.

---

## Flow 7 — History load failure + retry

1. Stop the backend server.
2. Reload the page. Verify the recent invoices list shows:
   "Error al cargar las facturas. [Reintentar]"
3. Restart the backend, click **Reintentar**. Verify invoices load correctly.

---

## Regression checks after every deploy

- [ ] Default mode on "Nueva factura" is **Automática** (intelligent), not Manual.
- [ ] All status badges show **Borrador / Oficial / Especial** (never DRAFT/OFFICIAL/SPECIAL).
- [ ] No raw English backend messages appear in any error scenario.
- [ ] Banner never stays visible indefinitely (auto-dismisses in ≤7 s, or user dismisses with ×).
- [ ] Success actions use toast only — no success banner.
- [ ] Buttons restore label after loading completes (no stuck "Cargando..." state).
