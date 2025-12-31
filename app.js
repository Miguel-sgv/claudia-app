// ========================================
// CONFIGURACIÓN Y CONSTANTES
// ========================================

// Clave para guardar datos en LocalStorage
const STORAGE_KEY = 'registros-horas';

// Zonas de trabajo disponibles
const ZONAS = [
    'Coordinadora',
    'Habitaciones',
    'Guardia',
    'Zona 0',
    'Zona SS',
    'Lavanderia',
    'Corps'
];

// Días de la semana en español
const DIAS_SEMANA = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado'
];

// ========================================
// INICIALIZACIÓN DE LA APP
// ========================================

// Esta función se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ App iniciada correctamente');

    // Controlar pantalla de bienvenida
    const welcomeScreen = document.getElementById('welcome-screen');
    const btnContinue = document.getElementById('btn-continue');

    if (btnContinue) {
        btnContinue.addEventListener('click', () => {
            welcomeScreen.classList.add('fade-out');
            setTimeout(() => {
                welcomeScreen.style.display = 'none';
                document.body.classList.add('welcome-dismissed');
            }, 800);
        });
    }

    // Inicializar componentes
    inicializarNavegacion();
    inicializarFormulario();
    inicializarSubTabs();
    inicializarFiltros();
    establecerFechaActual();

    // Cargar datos guardados
    cargarRegistros();

    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('💖 Service Worker registrado:', registration);
            })
            .catch((error) => {
                console.log('❌ Error al registrar Service Worker:', error);
            });
    }
});

// ========================================
// NAVEGACIÓN ENTRE VISTAS
// ========================================

function inicializarNavegacion() {
    // Obtener todos los botones de navegación
    const tabButtons = document.querySelectorAll('.tab-btn');

    // Añadir evento click a cada botón
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Obtener el nombre de la vista desde el atributo data-view
            const viewName = button.getAttribute('data-view');
            cambiarVista(viewName);
        });
    });
}

function cambiarVista(viewName) {
    // 1. Remover clase 'active' de todos los botones y vistas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // 2. Añadir clase 'active' al botón y vista seleccionados
    const activeButton = document.querySelector(`[data-view="${viewName}"]`);
    const activeView = document.getElementById(`view-${viewName}`);

    if (activeButton && activeView) {
        activeButton.classList.add('active');
        activeView.classList.add('active');
    }

    // 3. Actualizar datos si es necesario
    if (viewName === 'lista') {
        mostrarListaRegistros();
    } else if (viewName === 'resumen') {
        // Mostrar el período activo (semanal o mensual)
        const periodoActivo = document.querySelector('.sub-tab-btn.active').getAttribute('data-periodo');
        if (periodoActivo === 'semanal') {
            mostrarResumenSemanal();
        } else {
            mostrarResumenMensual();
        }
    }
}

// ========================================
// SUB-PESTAÑAS (Semanal/Mensual)
// ========================================

function inicializarSubTabs() {
    const subTabButtons = document.querySelectorAll('.sub-tab-btn');

    subTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover active de todos
            subTabButtons.forEach(btn => btn.classList.remove('active'));

            // Añadir active al clickeado
            button.classList.add('active');

            // Mostrar el resumen correspondiente
            const periodo = button.getAttribute('data-periodo');
            if (periodo === 'semanal') {
                mostrarResumenSemanal();
            } else if (periodo === 'mensual') {
                mostrarResumenMensual();
            }
        });
    });
}

// ========================================
// FILTROS DE REGISTROS
// ========================================

// Variable global para almacenar filtros activos
let filtrosActivos = {
    periodo: 'todos',
    fechaDesde: null,
    fechaHasta: null
};

function inicializarFiltros() {
    const filtroPeriodo = document.getElementById('filtro-periodo');
    const filtrosPersonalizados = document.getElementById('filtros-personalizados');
    const btnAplicar = document.getElementById('btn-aplicar-filtro');
    const btnLimpiar = document.getElementById('btn-limpiar-filtro');

    // Cambio de período
    filtroPeriodo.addEventListener('change', (e) => {
        const periodo = e.target.value;
        filtrosActivos.periodo = periodo;

        // Mostrar/ocultar filtros personalizados
        if (periodo === 'personalizado') {
            filtrosPersonalizados.classList.remove('hidden');
        } else {
            filtrosPersonalizados.classList.add('hidden');
            // Aplicar filtro automáticamente si no es personalizado
            mostrarListaRegistros();
        }
    });

    // Aplicar filtro personalizado
    btnAplicar.addEventListener('click', () => {
        const desde = document.getElementById('fecha-desde').value;
        const hasta = document.getElementById('fecha-hasta').value;

        if (!desde || !hasta) {
            mostrarMensaje('Por favor selecciona ambas fechas', 'error');
            return;
        }

        if (desde > hasta) {
            mostrarMensaje('La fecha "Desde" debe ser anterior a "Hasta"', 'error');
            return;
        }

        filtrosActivos.fechaDesde = desde;
        filtrosActivos.fechaHasta = hasta;
        mostrarListaRegistros();
    });

    // Limpiar filtros
    btnLimpiar.addEventListener('click', () => {
        filtroPeriodo.value = 'todos';
        document.getElementById('fecha-desde').value = '';
        document.getElementById('fecha-hasta').value = '';
        filtrosPersonalizados.classList.add('hidden');

        filtrosActivos = {
            periodo: 'todos',
            fechaDesde: null,
            fechaHasta: null
        };

        mostrarListaRegistros();
    });
}

// ========================================
// FORMULARIO DE REGISTRO
// ========================================

function inicializarFormulario() {
    const form = document.getElementById('form-registro');

    // Evento cuando se envía el formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevenir recarga de página
        guardarNuevoRegistro();
    });
}

function establecerFechaActual() {
    // Obtener fecha actual en formato YYYY-MM-DD
    const hoy = new Date();
    const fechaFormateada = hoy.toISOString().split('T')[0];

    // Establecer en el input de fecha
    document.getElementById('fecha').value = fechaFormateada;
}

function guardarNuevoRegistro() {
    // 1. Obtener valores del formulario
    const fecha = document.getElementById('fecha').value;
    const zona = document.getElementById('zona').value;
    const horaEntrada = document.getElementById('horaEntrada').value;
    const horaSalida = document.getElementById('horaSalida').value;

    // 2. Validar que todos los campos estén llenos
    if (!fecha || !zona || !horaEntrada || !horaSalida) {
        mostrarMensaje('Por favor completa todos los campos', 'error');
        return;
    }

    // 3. Calcular horas trabajadas
    const totalHoras = calcularHorasTrabajadas(horaEntrada, horaSalida);

    if (totalHoras <= 0) {
        mostrarMensaje('La hora de salida debe ser posterior a la de entrada', 'error');
        return;
    }

    // 4. Obtener día de la semana
    const diaSemana = obtenerDiaSemana(fecha);

    // 5. Obtener registros existentes
    const registros = obtenerRegistros();

    // 6. Verificar si estamos editando o creando nuevo
    if (registroEnEdicion) {
        // MODO EDICIÓN: Actualizar registro existente
        const index = registros.findIndex(r => r.id === registroEnEdicion);

        if (index !== -1) {
            registros[index] = {
                id: registroEnEdicion, // Mantener el mismo ID
                fecha: fecha,
                zona: zona,
                horaEntrada: horaEntrada,
                horaSalida: horaSalida,
                totalHoras: totalHoras,
                diaSemana: diaSemana
            };

            guardarRegistros(registros);
            mostrarMensaje('✅ Registro actualizado correctamente', 'success');
            console.log('✏️ Registro actualizado:', registros[index]);
        }

        // Resetear modo edición
        registroEnEdicion = null;

        // Restaurar botón
        const btnSubmit = document.querySelector('#form-registro button[type="submit"]');
        btnSubmit.textContent = '💾 Guardar Registro';
        btnSubmit.style.background = '';

    } else {
        // MODO CREACIÓN: Crear nuevo registro
        const nuevoRegistro = {
            id: Date.now().toString(), // ID único basado en timestamp
            fecha: fecha,
            zona: zona,
            horaEntrada: horaEntrada,
            horaSalida: horaSalida,
            totalHoras: totalHoras,
            diaSemana: diaSemana
        };

        registros.push(nuevoRegistro);
        guardarRegistros(registros);
        mostrarMensaje('✅ Registro guardado correctamente', 'success');
        console.log('📝 Nuevo registro guardado:', nuevoRegistro);
    }

    // 7. Limpiar formulario
    document.getElementById('form-registro').reset();
    establecerFechaActual();
}

// ========================================
// FUNCIONES DE CÁLCULO
// ========================================

function calcularHorasTrabajadas(horaEntrada, horaSalida) {
    // Convertir strings de hora a minutos desde medianoche
    const [horasE, minutosE] = horaEntrada.split(':').map(Number);
    const [horasS, minutosS] = horaSalida.split(':').map(Number);

    const minutosEntrada = horasE * 60 + minutosE;
    const minutosSalida = horasS * 60 + minutosS;

    // Calcular diferencia en minutos
    let diferenciaMinutos = minutosSalida - minutosEntrada;

    // Si la salida es al día siguiente (ej: entrada 23:00, salida 02:00)
    if (diferenciaMinutos < 0) {
        diferenciaMinutos += 24 * 60; // Añadir 24 horas en minutos
    }

    // Convertir a horas decimales
    return (diferenciaMinutos / 60).toFixed(2);
}

function obtenerDiaSemana(fechaString) {
    const fecha = new Date(fechaString + 'T00:00:00');
    const numeroDia = fecha.getDay();
    return DIAS_SEMANA[numeroDia];
}

// ========================================
// GESTIÓN DE LOCALSTORAGE
// ========================================

function obtenerRegistros() {
    // Obtener datos del LocalStorage
    const datos = localStorage.getItem(STORAGE_KEY);

    // Si no hay datos, devolver array vacío
    if (!datos) {
        return [];
    }

    // Convertir JSON string a array de objetos
    return JSON.parse(datos);
}

function guardarRegistros(registros) {
    // Convertir array a JSON string y guardar
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

// ========================================
// MOSTRAR LISTA DE REGISTROS
// ========================================

function cargarRegistros() {
    // Esta función se llama al iniciar la app
    const registros = obtenerRegistros();
    console.log(`📊 ${registros.length} registros cargados`);
}

function mostrarListaRegistros() {
    const container = document.getElementById('lista-registros');
    let registros = obtenerRegistros();
    // Aplicar filtros
    registros = aplicarFiltros(registros);

    // Si no hay registros, mostrar mensaje
    if (registros.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay registros todavía. ¡Crea tu primer registro!</p>';
        return;
    }

    // Ordenar registros por fecha (más reciente primero)
    const registrosOrdenados = registros.sort((a, b) => {
        // Comparar fechas y luego horas de entrada
        if (a.fecha === b.fecha) {
            return b.horaEntrada.localeCompare(a.horaEntrada);
        }
        return b.fecha.localeCompare(a.fecha);
    });

    // Generar HTML para cada registro
    const html = registrosOrdenados.map(registro => crearCardRegistro(registro)).join('');

    container.innerHTML = html;

    // Añadir eventos a los botones
    asignarEventosBotones();
}

function crearCardRegistro(registro) {
    // Formatear la fecha para mostrar
    const fechaFormateada = formatearFecha(registro.fecha);

    return `
        <div class="registro-card" data-id="${registro.id}">
            <div class="registro-header">
                <div>
                    <div class="registro-fecha">${fechaFormateada}</div>
                    <div class="registro-dia">${registro.diaSemana}</div>
                </div>
                <div class="zona-badge">${registro.zona}</div>
            </div>
            
            <div class="registro-body">
                <div class="registro-info">
                    <span class="registro-label">Entrada</span>
                    <span class="registro-value">${registro.horaEntrada}</span>
                </div>
                
                <div class="registro-info">
                    <span class="registro-label">Salida</span>
                    <span class="registro-value">${registro.horaSalida}</span>
                </div>
                
                <div class="registro-info">
                    <span class="registro-label">Total</span>
                    <span class="registro-value highlight">${formatearHoras(registro.totalHoras)}</span>
                </div>
            </div>
            
            <div class="registro-actions">
                <button class="btn-icon btn-edit" data-id="${registro.id}">
                    ✏️ Editar
                </button>
                <button class="btn-icon btn-delete" data-id="${registro.id}">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `;
}

function asignarEventosBotones() {
    // Botones de editar
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            editarRegistro(id);
        });
    });

    // Botones de eliminar
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            eliminarRegistro(id);
        });
    });
}

function mostrarResumenSemanal() {
    const container = document.getElementById('resumen-semanal');
    const registros = obtenerRegistros();

    if (registros.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay datos para mostrar. ¡Crea algunos registros primero!</p>';
        return;
    }

    // 1. Obtener rango de la semana actual (Lunes a Domingo)
    const { inicio, fin } = obtenerSemanaActual();

    // 2. Filtrar registros de la semana actual
    const registrosSemana = registros.filter(r => {
        return r.fecha >= inicio && r.fecha <= fin;
    });

    if (registrosSemana.length === 0) {
        container.innerHTML = `
            <div class="resumen-header">
                <div class="resumen-periodo">Semana Actual</div>
                <div class="resumen-fechas">${formatearFecha(inicio)} - ${formatearFecha(fin)}</div>
            </div>
            <p class="empty-state">No hay registros para esta semana.</p>
        `;
        return;
    }

    // 3. Calcular estadísticas
    const stats = calcularEstadisticasSemana(registrosSemana);

    // 4. Generar HTML
    const html = `
        <div class="resumen-header">
            <div class="resumen-periodo">Semana Actual</div>
            <div class="resumen-fechas">${formatearFecha(inicio)} - ${formatearFecha(fin)}</div>
        </div>
        
        <div class="kpis-grid">
            <div class="kpi-card">
                <div class="kpi-label">Total Horas</div>
                <div class="kpi-value">${stats.totalHoras.toFixed(1)}</div>
                <div class="kpi-subtitle">esta semana</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Días Trabajados</div>
                <div class="kpi-value">${stats.diasTrabajados}</div>
                <div class="kpi-subtitle">de 7 días</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Promedio Diario</div>
                <div class="kpi-value">${stats.promedioDiario.toFixed(1)}</div>
                <div class="kpi-subtitle">horas/día</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Zona Principal</div>
                <div class="kpi-value" style="font-size: 1.2rem;">${stats.zonaPrincipal}</div>
                <div class="kpi-subtitle">${stats.horasZonaPrincipal.toFixed(1)}h</div>
            </div>
        </div>
        
        <div class="zona-breakdown">
            <h3 class="zona-breakdown-title">📊 Desglose por Zona</h3>
            ${generarDesgloseZonas(stats.porZona, stats.totalHoras)}
        </div>
    `;

    container.innerHTML = html;
}

// ========================================
// CÁLCULOS DE SEMANA
// ========================================

function obtenerSemanaActual() {
    const hoy = new Date();

    // Obtener el día de la semana (0 = Domingo, 1 = Lunes, etc.)
    const diaSemana = hoy.getDay();

    // Calcular cuántos días restar para llegar al lunes
    const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;

    // Fecha de inicio (Lunes)
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diasHastaLunes);

    // Fecha de fin (Domingo)
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);

    // Formatear como YYYY-MM-DD
    return {
        inicio: formatearFechaISO(inicio),
        fin: formatearFechaISO(fin)
    };
}

function formatearFechaISO(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calcularEstadisticasSemana(registros) {
    // 1. Total de horas
    const totalHoras = registros.reduce((total, r) => {
        return total + parseFloat(r.totalHoras);
    }, 0);

    // 2. Días únicos trabajados
    const fechasUnicas = [...new Set(registros.map(r => r.fecha))];
    const diasTrabajados = fechasUnicas.length;

    // 3. Promedio diario
    const promedioDiario = diasTrabajados > 0 ? totalHoras / diasTrabajados : 0;

    // 4. Horas por zona
    const porZona = registros.reduce((acc, r) => {
        if (!acc[r.zona]) {
            acc[r.zona] = 0;
        }
        acc[r.zona] += parseFloat(r.totalHoras);
        return acc;
    }, {});

    // 5. Zona con más horas
    let zonaPrincipal = '';
    let horasZonaPrincipal = 0;

    for (const [zona, horas] of Object.entries(porZona)) {
        if (horas > horasZonaPrincipal) {
            zonaPrincipal = zona;
            horasZonaPrincipal = horas;
        }
    }

    return {
        totalHoras,
        diasTrabajados,
        promedioDiario,
        porZona,
        zonaPrincipal,
        horasZonaPrincipal
    };
}

function generarDesgloseZonas(porZona, totalHoras) {
    // Convertir objeto a array y ordenar por horas (mayor a menor)
    const zonasArray = Object.entries(porZona)
        .map(([zona, horas]) => ({ zona, horas }))
        .sort((a, b) => b.horas - a.horas);

    // Generar HTML para cada zona
    return zonasArray.map(({ zona, horas }) => {
        const porcentaje = (horas / totalHoras) * 100;

        return `
            <div class="zona-item">
                <div class="zona-item-header">
                    <span class="zona-nombre">${zona}</span>
                    <span class="zona-horas">${formatearHoras(horas)}</span>
                </div>
                <div class="zona-bar-container">
                    <div class="zona-bar" style="width: ${porcentaje}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// MENSAJES AL USUARIO
// ========================================

function mostrarMensaje(texto, tipo = 'success') {
    const mensajeDiv = document.getElementById('mensaje');

    // Establecer texto y clase
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;

    // Ocultar después de 3 segundos
    setTimeout(() => {
        mensajeDiv.classList.add('hidden');
    }, 3000);
}

// ========================================
// UTILIDADES
// ========================================

function formatearFecha(fechaString) {
    const fecha = new Date(fechaString + 'T00:00:00');
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function formatearHoras(horas) {
    const horasNum = parseFloat(horas);
    const horasEnteras = Math.floor(horasNum);
    const minutos = Math.round((horasNum - horasEnteras) * 60);
    return `${horasEnteras}h ${minutos}m`;
}

// ========================================
// EDITAR Y ELIMINAR REGISTROS
// ========================================

// Variable global para saber si estamos editando
let registroEnEdicion = null;

function editarRegistro(id) {
    // 1. Buscar el registro por ID
    const registros = obtenerRegistros();
    const registro = registros.find(r => r.id === id);

    if (!registro) {
        mostrarMensaje('❌ Registro no encontrado', 'error');
        return;
    }

    // 2. Guardar que estamos editando
    registroEnEdicion = id;

    // 3. Cargar datos en el formulario
    document.getElementById('fecha').value = registro.fecha;
    document.getElementById('zona').value = registro.zona;
    document.getElementById('horaEntrada').value = registro.horaEntrada;
    document.getElementById('horaSalida').value = registro.horaSalida;

    // 4. Cambiar el texto del botón
    const btnSubmit = document.querySelector('#form-registro button[type="submit"]');
    btnSubmit.textContent = '✏️ Actualizar Registro';
    btnSubmit.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';

    // 5. Cambiar a la vista de registro
    cambiarVista('registro');

    // 6. Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });

    mostrarMensaje('📝 Editando registro. Modifica los campos y guarda.', 'success');
}

function eliminarRegistro(id) {
    // 1. Pedir confirmación al usuario
    const confirmar = confirm('¿Estás seguro de que quieres eliminar este registro?');

    if (!confirmar) {
        return; // Usuario canceló
    }

    // 2. Obtener registros y filtrar el que queremos eliminar
    const registros = obtenerRegistros();
    const registrosFiltrados = registros.filter(r => r.id !== id);

    // 3. Guardar la nueva lista sin el registro eliminado
    guardarRegistros(registrosFiltrados);

    // 4. Actualizar la vista
    mostrarListaRegistros();

    // 5. Mostrar mensaje de confirmación
    mostrarMensaje('🗑️ Registro eliminado correctamente', 'success');

    console.log(`🗑️ Registro ${id} eliminado`);
}

// ========================================
// APLICAR FILTROS A REGISTROS
// ========================================

function aplicarFiltros(registros) {
    const { periodo, fechaDesde, fechaHasta } = filtrosActivos;

    if (periodo === 'todos') {
        return registros;
    }

    if (periodo === 'semana') {
        const { inicio, fin } = obtenerSemanaActual();
        return registros.filter(r => r.fecha >= inicio && r.fecha <= fin);
    }

    if (periodo === 'mes') {
        const { inicio, fin } = obtenerMesActual();
        return registros.filter(r => r.fecha >= inicio && r.fecha <= fin);
    }

    if (periodo === 'personalizado' && fechaDesde && fechaHasta) {
        return registros.filter(r => r.fecha >= fechaDesde && r.fecha <= fechaHasta);
    }

    return registros;
}

// ========================================
// RESUMEN MENSUAL
// ========================================

function mostrarResumenMensual() {
    const container = document.getElementById('resumen-semanal');
    const registros = obtenerRegistros();

    if (registros.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay datos para mostrar. ¡Crea algunos registros primero!</p>';
        return;
    }

    // 1. Obtener rango del mes actual
    const { inicio, fin } = obtenerMesActual();

    // 2. Filtrar registros del mes actual
    const registrosMes = registros.filter(r => {
        return r.fecha >= inicio && r.fecha <= fin;
    });

    if (registrosMes.length === 0) {
        container.innerHTML = `
            <div class="resumen-header">
                <div class="resumen-periodo">Mes Actual</div>
                <div class="resumen-fechas">${formatearFecha(inicio)} - ${formatearFecha(fin)}</div>
            </div>
            <p class="empty-state">No hay registros para este mes.</p>
        `;
        return;
    }

    // 3. Calcular estadísticas
    const stats = calcularEstadisticasSemana(registrosMes); // Reutilizamos la función

    // 4. Generar HTML
    const html = `
        <div class="resumen-header">
            <div class="resumen-periodo">Mes Actual</div>
            <div class="resumen-fechas">${formatearFecha(inicio)} - ${formatearFecha(fin)}</div>
        </div>
        
        <div class="kpis-grid">
            <div class="kpi-card">
                <div class="kpi-label">Total Horas</div>
                <div class="kpi-value">${stats.totalHoras.toFixed(1)}</div>
                <div class="kpi-subtitle">este mes</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Días Trabajados</div>
                <div class="kpi-value">${stats.diasTrabajados}</div>
                <div class="kpi-subtitle">de ${obtenerDiasDelMes()} días</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Promedio Diario</div>
                <div class="kpi-value">${stats.promedioDiario.toFixed(1)}</div>
                <div class="kpi-subtitle">horas/día</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Zona Principal</div>
                <div class="kpi-value" style="font-size: 1.2rem;">${stats.zonaPrincipal}</div>
                <div class="kpi-subtitle">${stats.horasZonaPrincipal.toFixed(1)}h</div>
            </div>
        </div>
        
        <div class="zona-breakdown">
            <h3 class="zona-breakdown-title">📊 Desglose por Zona</h3>
            ${generarDesgloseZonas(stats.porZona, stats.totalHoras)}
        </div>
    `;

    container.innerHTML = html;
}

function obtenerMesActual() {
    const hoy = new Date();

    // Primer día del mes
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Último día del mes
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    return {
        inicio: formatearFechaISO(inicio),
        fin: formatearFechaISO(fin)
    };
}

function obtenerDiasDelMes() {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
}
