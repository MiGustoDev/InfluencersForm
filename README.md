## Mi Gusto Canjes

Aplicación React + Vite para gestionar el formulario de canjes con influencers de Mi Gusto. Carga dinámica de campos desde Supabase, interfaz tematizada y paneles seguros para administración e historial de envíos.

![Demo](public/forminflusdemo1.png)

![Demo](public/forminflusdemo2.png)

![Demo](public/forminflusdemo3.png)

---

### Tecnologías
- **React 18 + TypeScript** sobre **Vite**
- **Tailwind CSS** para estilos
- **Supabase** (Postgres + policies) como backend

---

### Características destacadas
- Formulario dinámico: los campos activos se cargan desde la configuración en Supabase.
- Animaciones y feedback visual: loaders, paneles laterales y confirmaciones contextuales.
- Panel administrador para crear/editar campos (incluye estado visual y recordatorios).
- Historial de envíos con búsqueda, filtros, edición, eliminación y “deshacer”.
- Accesos protegidos por PIN (persistente en `localStorage` tras la primera validación).
- Diseño responsive, con accesos sutiles para móvil/desktop.

---

### Despliegue en (`https://migusto.com.ar/canje`)

Desarrollado por el [Departamento de Sistemas](https://waveframe.com.ar) de Mi Gusto 🥟