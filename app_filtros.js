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
