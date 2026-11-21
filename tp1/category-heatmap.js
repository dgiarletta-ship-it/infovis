(function () {
  const heatColors = ['#fed7aa', '#fdba74', '#fb7185', '#ef4444', '#b91c1c'];
  const style = document.createElement('style');
  style.textContent = `
    #category-heatmap-chart { overflow-x: auto; }
    #category-heatmap-chart svg { display: block; max-width: none; }
    #category-heatmap-chart .heatmap-label { fill: #cbd5e1; font-size: 12px; }
    #category-heatmap-chart .heatmap-month { fill: #cbd5e1; font-size: 11px; }
    #category-heatmap-chart .heatmap-empty { fill: #1e293b; }
    #category-heatmap-chart .heatmap-legend-label { fill: #cbd5e1; font-size: 11px; }
    body.light-theme #category-heatmap-chart .heatmap-label,
    body.light-theme #category-heatmap-chart .heatmap-month,
    body.light-theme #category-heatmap-chart .heatmap-legend-label { fill: #334155; }
    body.light-theme #category-heatmap-chart .heatmap-empty { fill: #e2e8f0; }
    @media print { #category-heatmap-chart { overflow: visible; } #category-heatmap-chart svg { max-width: 100%; } }
  `;
  document.head.appendChild(style);

  function monthLabel(period) {
    const [month, year] = period.split('/').map(Number);
    const label = new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(new Date(year, month - 1, 1));
    return `${label.replace('.', '')} ${String(year).slice(-2)}`;
  }

  window.renderCategoryHeatmap = function (rows, categories, periods) {
    const container = d3.select('#category-heatmap-chart').html('');
    const node = container.node();
    if (!node || !rows.length || !categories.length || !periods.length) return;

    const margin = { top: 42, right: 16, bottom: 48, left: 190 };
    const rowHeight = 28;
    const width = Math.max(node.clientWidth, 190 + 16 + periods.length * 58);
    const height = margin.top + categories.length * rowHeight + margin.bottom;
    const cellWidth = (width - margin.left - margin.right) / periods.length;
    const counts = new Map();

    for (const row of rows) {
      const key = `${row.category}\u0000${row.period}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const cells = categories.flatMap((category, rowIndex) => periods.map((period, periodIndex) => ({
      category,
      period,
      count: counts.get(`${category}\u0000${period}`) || 0,
      x: margin.left + periodIndex * cellWidth,
      y: margin.top + rowIndex * rowHeight
    })));
    const positiveCounts = cells.filter(cell => cell.count > 0).map(cell => cell.count);
    const color = d3.scaleQuantile().domain(positiveCounts).range(heatColors);
    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-label', 'Mapa de calor de transacciones por categoría y mes');

    svg.selectAll('.heatmap-month')
      .data(periods)
      .join('text')
      .attr('class', 'heatmap-month')
      .attr('x', (period, index) => margin.left + index * cellWidth + cellWidth / 2)
      .attr('y', margin.top - 12)
      .attr('text-anchor', 'middle')
      .text(monthLabel)
      .append('title')
      .text(period => period);

    svg.selectAll('.heatmap-label')
      .data(categories)
      .join('text')
      .attr('class', 'heatmap-label')
      .attr('x', margin.left - 10)
      .attr('y', (category, index) => margin.top + index * rowHeight + rowHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .text(category => category);

    const cellGroups = svg.selectAll('.heatmap-cell')
      .data(cells)
      .join('g')
      .attr('class', 'heatmap-cell');

    cellGroups.append('rect')
      .attr('class', cell => cell.count ? 'heatmap-value' : 'heatmap-empty')
      .attr('x', cell => cell.x + 2)
      .attr('y', cell => cell.y + 2)
      .attr('width', Math.max(0, cellWidth - 4))
      .attr('height', rowHeight - 4)
      .attr('rx', 3)
      .attr('fill', cell => cell.count ? color(cell.count) : null)
      .append('title')
      .text(cell => `${cell.category} · ${cell.period}: ${cell.count} ${cell.count === 1 ? 'transacción' : 'transacciones'}`);

    cellGroups.filter(cell => cell.count > 0)
      .append('text')
      .attr('x', cell => cell.x + cellWidth / 2)
      .attr('y', cell => cell.y + rowHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', cell => heatColors.indexOf(color(cell.count)) < 2 ? '#7c2d12' : '#fff')
      .attr('font-size', 11)
      .attr('pointer-events', 'none')
      .text(cell => cell.count);

    const legendY = margin.top + categories.length * rowHeight + 20;
    const legend = svg.append('g').attr('transform', `translate(${margin.left},${legendY})`);
    legend.append('text').attr('class', 'heatmap-legend-label').attr('x', 0).attr('y', 10).text('Sin transacciones');
    legend.append('rect').attr('class', 'heatmap-empty').attr('x', 104).attr('y', -2).attr('width', 18).attr('height', 16).attr('rx', 2);
    heatColors.forEach((value, index) => {
      const x = 144 + index * 24;
      legend.append('rect').attr('x', x).attr('y', -2).attr('width', 18).attr('height', 16).attr('rx', 2).attr('fill', value);
    });
    legend.append('text').attr('class', 'heatmap-legend-label').attr('x', 270).attr('y', 10).text('Pocas');
    legend.append('text').attr('class', 'heatmap-legend-label').attr('x', 328).attr('y', 10).text('Muchas');
  };
})();
