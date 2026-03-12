/**
 * =======================================================
 *  ÍNDICE — scripts.js
 * =======================================================
 *  Líneas   1  -  30  : Constantes y selectores del DOM
 *  Líneas  31  -  80  : Menú hamburguesa (toggle mobile)
 *  Líneas  81  - 120  : Scroll suave para anclas
 *  Líneas 121  - 200  : Validación del formulario
 *  Líneas 201  - 270  : Envío del formulario (fetch)
 *  Líneas 271  - 320  : Funciones auxiliares de UI
 *  Líneas 321+        : Inicialización
 * =======================================================
 *
 *  PARA CONECTAR EL FORMULARIO A UN BACKEND REAL:
 *  1. Cambia la constante ENDPOINT (línea 16) con tu URL real.
 *     Ej: 'https://formspree.io/f/TU_ID_AQUI' para FormSpree
 *  2. Si tu backend necesita autenticación, agrega un campo
 *     `headers` al objeto fetch con el token correspondiente.
 *  3. Si necesitas enviar JSON en lugar de FormData, ajusta
 *     el `body` del fetch (ver comentario en la función sendForm).
 *  4. Ajusta la función `handleSuccess` y `handleError` para
 *     personalizar los mensajes de notificación.
 */

'use strict';

/* =======================================================
   CONSTANTES GLOBALES
   -------------------------------------------------------
   ENDPOINT → URL del backend que recibirá el formulario.
   Para usar FormSpree: 'https://formspree.io/f/xyzabcde'
   Para un endpoint propio: 'https://tu-dominio.com/api/contacto'
   Para pruebas: 'https://example.com/submit' (siempre falla, es un placeholder)
======================================================= */
const ENDPOINT = 'https://formspree.io/f/mbdawplj';

/* Selectores del DOM — se obtienen una sola vez para mejor rendimiento */
const form        = document.getElementById('contactForm');
const submitBtn   = document.getElementById('submitBtn');
const submitText  = document.getElementById('submitText');
const submitLoad  = document.getElementById('submitLoading');
const notification = document.getElementById('formNotification');

/* Campos del formulario */
const fields = {
  nombre:  document.getElementById('nombre'),
  email:   document.getElementById('email'),
  mensaje: document.getElementById('mensaje'),
};

/* Elementos de error por campo */
const errors = {
  nombre:  document.getElementById('nombreError'),
  email:   document.getElementById('emailError'),
  mensaje: document.getElementById('mensajeError'),
};

/* =====================================================
   MENÚ HAMBURGUESA (móvil)
   -------------------------------------------------------
   Alterna la clase .is-open en la lista de navegación
   y el atributo aria-expanded del botón al hacer clic.
   También cierra el menú al hacer clic en un enlace.
   
   Si quieres que el menú se cierre al hacer clic fuera:
   agrega un evento 'click' al document y verifica si el
   clic ocurrió dentro de .nav usando el método closest().
======================================================= */
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

/**
 * Alterna el estado abierto/cerrado del menú móvil.
 * Modifica aria-expanded para accesibilidad con lectores de pantalla.
 */
function toggleMenu() {
  const isOpen = navMenu.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', isOpen.toString());
}

/**
 * Cierra el menú móvil si está abierto.
 * Se llama al hacer clic en un enlace del menú.
 */
function closeMenu() {
  navMenu.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

/* Evento del botón hamburguesa */
if (navToggle) {
  navToggle.addEventListener('click', toggleMenu);
}

/* Cerrar el menú al hacer clic en cualquier enlace del nav */
if (navMenu) {
  navMenu.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* Cerrar el menú al hacer clic fuera de él */
document.addEventListener('click', function (e) {
  if (navMenu && navToggle) {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      closeMenu();
    }
  }
});

/* =======================================================
   SCROLL SUAVE PARA ANCLAS
   -------------------------------------------------------
   Intercepta los clics en todos los enlaces con href="#..."
   y hace scroll suave hasta el destino con compensación del header.
   
   La compensación (offset) corresponde a la altura del header fijo (70px).
   Si cambias la altura del header en CSS, actualiza la variable `offset`.
======================================================= */
const HEADER_OFFSET = 70; // Altura del header fijo en px — ajusta si cambias el header

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return; // Ignorar enlaces "#" sin destino

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();

    const top = targetEl.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  });
});

/* =======================================================
   VALIDACIÓN DEL FORMULARIO
   -------------------------------------------------------
   Valida los campos requeridos antes del envío:
   - nombre  → no puede estar vacío, mínimo 2 caracteres
   - email   → debe tener formato válido (regex básico)
   - mensaje → no puede estar vacío, mínimo 10 caracteres
   
   Para agregar validación a nuevos campos:
   1. Agrega el campo al objeto `fields` arriba.
   2. Agrega su elemento de error al objeto `errors`.
   3. Agrega la lógica de validación en validateForm().
======================================================= */

/**
 * Expresión regular básica para validar formato de email.
 * Para validación más estricta puedes usar una librería como validator.js.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Muestra un mensaje de error debajo de un campo.
 * @param {HTMLElement} field  - El input/textarea con error
 * @param {HTMLElement} errEl  - El span donde se mostrará el error
 * @param {string}      msg    - El mensaje de error a mostrar
 */
function showFieldError(field, errEl, msg) {
  field.classList.add('is-error');
  errEl.textContent = msg;
}

/**
 * Limpia el error de un campo.
 * @param {HTMLElement} field  - El input/textarea a limpiar
 * @param {HTMLElement} errEl  - El span de error a vaciar
 */
function clearFieldError(field, errEl) {
  field.classList.remove('is-error');
  errEl.textContent = '';
}

/**
 * Limpia todos los errores del formulario.
 */
function clearAllErrors() {
  Object.keys(fields).forEach(key => {
    if (errors[key]) clearFieldError(fields[key], errors[key]);
  });
}

/**
 * Valida todos los campos requeridos del formulario.
 * @returns {boolean} true si el formulario es válido, false si hay errores.
 */
function validateForm() {
  let isValid = true;

  clearAllErrors();

  /* Validación: Nombre */
  const nombre = fields.nombre.value.trim();
  if (!nombre) {
    showFieldError(fields.nombre, errors.nombre, 'El nombre es requerido.');
    isValid = false;
  } else if (nombre.length < 2) {
    showFieldError(fields.nombre, errors.nombre, 'El nombre debe tener al menos 2 caracteres.');
    isValid = false;
  }

  /* Validación: Email */
  const email = fields.email.value.trim();
  if (!email) {
    showFieldError(fields.email, errors.email, 'El correo electrónico es requerido.');
    isValid = false;
  } else if (!EMAIL_REGEX.test(email)) {
    showFieldError(fields.email, errors.email, 'Ingrese un correo electrónico válido.');
    isValid = false;
  }

  /* Validación: Mensaje */
  const mensaje = fields.mensaje.value.trim();
  if (!mensaje) {
    showFieldError(fields.mensaje, errors.mensaje, 'El mensaje es requerido.');
    isValid = false;
  } else if (mensaje.length < 10) {
    showFieldError(fields.mensaje, errors.mensaje, 'El mensaje debe tener al menos 10 caracteres.');
    isValid = false;
  }

  /* Si hay errores, hace scroll al primer campo con error */
  if (!isValid) {
    const firstError = form.querySelector('.is-error');
    if (firstError) {
      const top = firstError.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  return isValid;
}

/* =======================================================
   FUNCIONES AUXILIARES DE UI — BOTÓN Y NOTIFICACIONES
   -------------------------------------------------------
   setSubmitting → deshabilita/habilita el botón de envío
   showNotification → muestra el mensaje global (éxito o error)
   hideNotification → oculta el mensaje global
======================================================= */

/**
 * Cambia el estado del botón de envío para prevenir doble envío.
 * @param {boolean} isSubmitting - true para deshabilitar, false para habilitar
 */
function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitText.hidden  = isSubmitting;
  submitLoad.hidden  = !isSubmitting;
  if (isSubmitting) {
    submitLoad.removeAttribute('aria-hidden');
  } else {
    submitLoad.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Muestra una notificación global en el formulario.
 * @param {string}  message - Texto del mensaje a mostrar
 * @param {'success'|'error'} type - Tipo de notificación
 */
function showNotification(message, type) {
  notification.textContent = message;
  notification.className   = `form-notification is-${type}`;
  notification.hidden      = false;

  /* Scroll suave hasta la notificación */
  const top = notification.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET - 20;
  window.scrollTo({ top, behavior: 'smooth' });
}

/**
 * Oculta la notificación global.
 */
function hideNotification() {
  notification.hidden    = true;
  notification.textContent = '';
  notification.className  = 'form-notification';
}

/* =======================================================
   ENVÍO DEL FORMULARIO (fetch)
   -------------------------------------------------------
   Usa la API fetch para enviar los datos al ENDPOINT.
   
   CÓMO CONECTAR A UN BACKEND REAL:
   
   Opción A — FormSpree (sin backend propio):
     1. Regístrate en https://formspree.io
     2. Crea un nuevo formulario y copia la URL
     3. Reemplaza la constante ENDPOINT con esa URL
     4. FormSpree envía los datos a tu email automáticamente
   
   Opción B — Backend propio (Node.js, PHP, Python, etc.):
     1. Crea un endpoint en tu servidor que acepte POST
     2. El endpoint recibirá un JSON con los campos del formulario
     3. Reemplaza ENDPOINT con la URL de tu endpoint
     4. Si necesitas autenticación (API key), agrégala en el objeto headers:
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer TU_API_KEY'
        }
   
   Opción C — Enviar como FormData (multipart):
     Reemplaza JSON.stringify(data) por new FormData(form)
     y elimina el header 'Content-Type' (el browser lo pone automáticamente)
   
   NOTA SOBRE CORS:
   Si tu frontend y backend están en dominios diferentes,
   el servidor debe tener habilitados los headers CORS correspondientes.
======================================================= */

/**
 * Recopila los datos del formulario en un objeto.
 * @returns {Object} Datos del formulario
 */
function getFormData() {
  return {
    nombre:   document.getElementById('nombre').value.trim(),
    empresa:  document.getElementById('empresa').value.trim(),
    email:    document.getElementById('email').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    mensaje:  document.getElementById('mensaje').value.trim(),
  };
}

/**
 * Envía los datos del formulario al ENDPOINT mediante fetch.
 * Muestra notificaciones de éxito o error según el resultado.
 */
async function sendForm() {
  setSubmitting(true);
  hideNotification();

  try {
    /* Enviamos como FormData — Formspree lo requiere para funcionar
       sin verificación de dominio y sin configuración extra.
       El header 'Accept: application/json' hace que Formspree
       devuelva JSON en vez de redirigir, lo que permite detectar
       el éxito/error correctamente en la misma página. */
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: new FormData(form),
    });

    if (response.ok) {
      /* Envío exitoso */
      form.reset();
      clearAllErrors();
      showNotification(
        '¡Mensaje enviado correctamente! Nos comunicaremos con usted a la brevedad.',
        'success'
      );
    } else {
      /* El servidor respondió con un error HTTP */
      throw new Error(`Error del servidor: ${response.status}`);
    }

  } catch (err) {
    /* Error de red o error del servidor */
    console.error('[Orintech Contacto] Error al enviar formulario:', err);
    showNotification(
      'Ocurrió un error al enviar el mensaje. Por favor intente de nuevo o contáctenos directamente a Orintech.sas@gmail.com',
      'error'
    );
  } finally {
    /* Siempre re-habilita el botón al finalizar */
    setSubmitting(false);
  }
}

/* =======================================================
   INICIALIZACIÓN — EVENTO SUBMIT DEL FORMULARIO
   -------------------------------------------------------
   Escucha el submit del formulario, valida y luego envía.
   El e.preventDefault() evita la recarga de la página.
======================================================= */
/* =======================================================
   BOTÓN FLOTANTE DE WHATSAPP — ANIMACIÓN DE ENTRADA
   -------------------------------------------------------
   El botón empieza invisible (opacity:0 en CSS).
   Tras 1.5 segundos se añade la clase .is-visible para
   que aparezca con una transición suave hacia arriba.
   Para que aparezca inmediatamente: cambia el delay a 0.
======================================================= */
const whatsappBtn = document.getElementById('whatsappBtn');
if (whatsappBtn) {
  setTimeout(() => {
    whatsappBtn.classList.add('is-visible');
  }, 1500); // Milisegundos de espera antes de aparecer — cambia este valor si deseas
}

if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Limpiar notificación anterior antes de validar */
    hideNotification();

    /* Validar campos — si hay errores, detenemos aquí */
    const isValid = validateForm();
    if (!isValid) return;

    /* Todo válido: enviar el formulario */
    sendForm();
  });

  /* Limpiar error individual al escribir en el campo
     Mejora la UX mostrando feedback inmediato al corregir */
  Object.keys(fields).forEach(key => {
    fields[key].addEventListener('input', function () {
      if (errors[key] && errors[key].textContent) {
        clearFieldError(fields[key], errors[key]);
      }
    });
  });
}
