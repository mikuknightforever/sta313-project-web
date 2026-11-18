/* Q1 composition prototype. Embedded values are extracted from the project CSVs;
 * provenance and calculations: season-chart-sources.json. No runtime requests. */
(() => {
  'use strict';
  const observations = /* DATA_START */[[2017,1,253831.916666667,353183.0,6.3999999999999995],[2017,2,254220.666666667,356097.0,6.2],[2017,3,250926.083333333,358988.0,5.766666666666667],[2017,4,247298.083333333,362276.0,5.866666666666667],[2018,1,248001.166666667,364873.0,5.633333333333333],[2018,2,248946.5,367894.0,5.666666666666667],[2018,3,244002.833333333,369546.0,5.666666666666667],[2018,4,239356.916666667,371753.0,5.566666666666666],[2019,1,240912.583333333,375509.0,5.7],[2019,2,243118.75,375475.0,5.466666666666666],[2019,3,238840.916666667,377603.0,5.6000000000000005],[2019,4,235500.5,379015.0,5.3999999999999995],[2020,1,244870.583333333,381192.0,6.433333333333334],[2020,2,235207.833333333,380006.0,12.966666666666667],[2020,3,212835.583333333,379954.0,10.466666666666667],[2020,4,200833.583333333,377393.0,9.433333333333334],[2021,1,196013.416666667,375609.0,9.166666666666666],[2021,2,186423.066810257,373955.0,9.200000000000001],[2021,3,178872.333333333,372545.0,7.666666666666667],[2021,4,193886.583333333,371306.0,6.5],[2022,1,206267.0,370188.0,6.166666666666667],[2022,2,212360.833333333,369458.0,5.366666666666667],[2022,3,216828.833333333,368781.0,5.333333333333333],[2022,4,219754.5,368718.0,5.466666666666666],[2023,1,232088.833333333,368176.0,5.266666666666667],[2023,2,236257.5,368334.0,5.366666666666667],[2023,3,240576.166666667,368676.0,5.733333333333333],[2023,4,251425.5,368247.0,6.166666666666667],[2024,1,264941.0,368855.0,6.5],[2024,2,275017.666666667,369354.0,6.833333333333333],[2024,3,282723.833333333,371732.0,7.0],[2024,4,285990.166666667,373758.0,7.466666666666666],[2025,1,289078.0,375415.0,7.5],[2025,2,292388.666666667,373989.0,7.833333333333333],[2025,3,290607.166666667,376869.0,7.8],[2025,4,289102.833333333,378389.0,7.633333333333333]]/* DATA_END */;
  const rows = observations.map(([year, quarter, ow, odsp, unemployment]) =>
    Object.freeze({year, quarter, month: quarter * 3, ow, odsp, unemployment}));
  const seasons = ['春', '夏', '秋', '冬'];
  const colors = {ow: '#2a78d6', odsp: '#c55a28', unemployment: '#43635c'};
  const fmt = (value, digits = 0) => new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  }).format(value);
  const signed = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${fmt(Math.abs(value), 1)}`;
  const quarterLabel = row => `${row.year} 年 Q${row.quarter}`;
  const NS = 'http://www.w3.org/2000/svg';
  function svgNode(name, attributes = {}, content) {
    const element = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (content != null) element.textContent = content;
    return element;
  }

  window.makeSeasonChart = function makeSeasonChart(container, onBack = () => {}) {
    if (!(container instanceof HTMLElement)) throw new TypeError('Season chart needs an HTML container.');
    let selected = 12, previousFocus = null, previousOverflow = '', resizeFrame = 0;
    const prefix = container.id || 'season-chart';
    container.classList.add('season-chart');
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-labelledby', `${prefix}-title`);
    container.innerHTML = `
      <div class="sc-page">
        <header class="sc-topbar"><button class="sc-back" type="button" data-back><span aria-hidden="true">←</span> 返回四季</button></header>
        <div class="sc-heading"><h2 id="${prefix}-title" tabindex="-1">压力变化时，<br class="sc-mobile-break">援助案件如何变化？</h2><p>从 2020 年的一季出发，放回 2017–2025 年的时间轴。</p></div>
        <div class="sc-selection">
          <label class="sc-year">查看年份<select aria-label="查看年份">${Array.from({length: 9}, (_, i) => `<option value="${2017 + i}">${2017 + i}</option>`).join('')}</select></label>
          <div class="sc-quarters" role="group" aria-label="选择季度">${seasons.map((season, i) => `<button type="button" data-quarter="${i + 1}" aria-pressed="false"><span>${season}</span><small>Q${i + 1} · ${(i + 1) * 3} 月</small></button>`).join('')}</div>
        </div>
        <p class="sc-period-note">四季为 Q1–Q4 的入口（1–3 / 4–6 / 7–9 / 10–12 月）；案件取季末月份，失业率取当季均值。</p>
        <section class="sc-readout" aria-labelledby="${prefix}-selected">
          <div class="sc-readout-heading"><h3 id="${prefix}-selected" data-season-landing></h3><span>安大略省 · 同比为较上年同季</span></div>
          <div class="sc-cards">
            <div class="sc-card sc-ow"><p><i aria-hidden="true"></i> OW 案件</p><strong data-value="ow"></strong><small data-change="ow"></small></div>
            <div class="sc-card sc-odsp"><p><i aria-hidden="true"></i> ODSP 案件</p><strong data-value="odsp"></strong><small data-change="odsp"></small></div>
            <div class="sc-card sc-unemployment"><p><i aria-hidden="true"></i> 失业率</p><strong data-value="unemployment"></strong><small data-change="unemployment"></small></div>
          </div>
          <p class="sc-sr-only" data-announcement aria-live="polite" aria-atomic="true"></p>
        </section>
        <figure class="sc-figure">
          <div class="sc-figure-header"><h3>同一时间轴，两种尺度</h3><div class="sc-legend" aria-label="图例"><span class="sc-ow"><i></i>OW</span><span class="sc-odsp"><i></i>ODSP</span><span class="sc-unemployment"><i></i>失业率</span></div></div>
          <div class="sc-chart" data-chart></div>
          <div class="sc-timeline"><label for="${prefix}-range">沿时间轴查值 <output id="${prefix}-time"></output></label><input id="${prefix}-range" type="range" min="0" max="35" step="1" value="12" aria-describedby="${prefix}-range-help"><div class="sc-range-ends"><span>2017 Q1</span><span>2025 Q4</span></div></div>
          <figcaption id="${prefix}-range-help">上图：在册案件，单位为万件。下图：经季节调整的失业率季度均值。淡色带标出 2020 年；滑动或用方向键选择季度。</figcaption>
        </figure>
        <p class="sc-limits">案件升降本身不能说明援助是否足够。还需结合收入、生活成本、资格与获得援助的难度。</p>
        <details class="sc-details"><summary>数据来源与口径</summary><div class="sc-definitions">
          <p><strong>案件不等于人数。</strong>OW 为 Ontario Works，ODSP 为 Ontario Disability Support Program；一个案件对应一个援助单位，可包括申请人及其家属。此处为全省案件总量，不是新增申请数、覆盖率或领取金额。</p>
          <p><strong>观测月份与季度均值不同。</strong>案件沿用项目课程数据中 3/6/9/12 月的数值，不对案件求季度平均；失业率为 Statistics Canada 安大略省 15 岁及以上、所有性别、经季节调整的三个月月度失业率的算术平均。四季是叙事入口，不是按自然季节重新汇总。</p>
          <p>案件按整数显示，计算保留源文件小数。失业率显示一位小数，同比变化以百分点表示；2017 年缺少本图范围内的上年数据，不显示同比。两项指标的共同变化不识别因果关系，失业率也不能概括残障相关需要。</p>
          <ul><li><a href="https://data.ontario.ca/dataset/ontario-social-assistance-case-characteristics-by-census-metropolitan-area" target="_blank" rel="noopener noreferrer">Ontario 官方来源与数据字典</a> · <a href="https://github.com/mjmoon/sta313-project-datasets/tree/064cf60c13e7ddfbd20c5cbfd1ec220bec200d92/ONT-SA" target="_blank" rel="noopener noreferrer">课程数据固定版本</a></li><li><a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410028701" target="_blank" rel="noopener noreferrer">Statistics Canada 表 14-10-0287-01 与定义</a></li><li><a href="https://github.com/mikuknightforever/sta313-project-docs/blob/d0f1214c9025bbe809983af41eaea66c7f3d6eee/design/q1/crisis-prototype/METHODS.md" target="_blank" rel="noopener noreferrer">项目 Q1 方法</a> · <a href="./season-chart-sources.json" download="season-chart-sources.json">本图数据记录与校验值</a></li></ul>
        </div></details>
        <details class="sc-details"><summary>查看 36 个季度的数据表</summary><div class="sc-table-wrap" tabindex="0" role="region" aria-label="季度数据表，可横向滚动"><table><caption>案件为对应月份观测；失业率为当季月度值的平均。显示精度与上图一致。</caption><thead><tr><th scope="col">季度 / 月份</th><th scope="col">OW 案件</th><th scope="col">ODSP 案件</th><th scope="col">失业率</th></tr></thead><tbody>${rows.map((row, i) => `<tr data-row="${i}"><th scope="row">${row.year} Q${row.quarter} / ${row.month} 月</th><td>${fmt(row.ow)}</td><td>${fmt(row.odsp)}</td><td>${fmt(row.unemployment, 1)}%</td></tr>`).join('')}</tbody></table></div></details>
      </div>`;

    const $ = selector => container.querySelector(selector);
    const chart = $('[data-chart]'), range = $('input[type="range"]'), yearSelect = $('select');
    const quarterButtons = [...container.querySelectorAll('[data-quarter]')];
    function draw() {
      const width = Math.max(280, Math.round(chart.getBoundingClientRect().width));
      const compact = width < 540, height = compact ? 338 : 372;
      const left = 38, right = 14, caseTop = 28, caseBottom = compact ? 162 : 183;
      const rateTop = compact ? 220 : 246, rateBottom = height - 31;
      const x = i => left + (width - left - right) * i / (rows.length - 1);
      const caseMax = Math.ceil(Math.max(...rows.flatMap(row => [row.ow, row.odsp])) / 100000) * 100000;
      const rateMax = Math.ceil(Math.max(...rows.map(row => row.unemployment)) / 5) * 5;
      const caseY = value => caseBottom - value / caseMax * (caseBottom - caseTop);
      const rateY = value => rateBottom - value / rateMax * (rateBottom - rateTop);
      const svg = svgNode('svg', {viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-labelledby': `${prefix}-svg-title ${prefix}-svg-desc`});
      svg.append(svgNode('title', {id: `${prefix}-svg-title`}, '2017–2025 年安大略省 OW、ODSP 案件与失业率'));
      svg.append(svgNode('desc', {id: `${prefix}-svg-desc`}, `两图共用时间轴，纵轴分别为案件数与百分比。当前选中 ${quarterLabel(rows[selected])}。准确数值在上方卡片及下方数据表中。`));
      for (const [top, bottom] of [[caseTop, caseBottom], [rateTop, rateBottom]]) {
        svg.append(svgNode('rect', {x: x(11.5), y: top, width: x(15.5) - x(11.5), height: bottom - top, class: 'sc-year-band'}));
        svg.append(svgNode('line', {x1: x(selected), x2: x(selected), y1: top, y2: bottom, class: 'sc-selected-line'}));
      }
      svg.append(svgNode('text', {x: left, y: 15, class: 'sc-axis-title'}, '案件 / 万件'));
      svg.append(svgNode('text', {x: left, y: rateTop - 13, class: 'sc-axis-title'}, '失业率 / %'));
      svg.append(svgNode('text', {x: (x(12) + x(15)) / 2, y: 15, 'text-anchor': 'middle', class: 'sc-year-tag'}, '2020'));
      for (let value = 0; value <= caseMax; value += 100000) {
        svg.append(svgNode('line', {x1: left, x2: width - right, y1: caseY(value), y2: caseY(value), class: 'sc-grid'}));
        svg.append(svgNode('text', {x: left - 8, y: caseY(value) + 4, 'text-anchor': 'end', class: 'sc-tick'}, value / 10000));
      }
      for (let value = 0; value <= rateMax; value += 5) {
        svg.append(svgNode('line', {x1: left, x2: width - right, y1: rateY(value), y2: rateY(value), class: 'sc-grid'}));
        svg.append(svgNode('text', {x: left - 8, y: rateY(value) + 4, 'text-anchor': 'end', class: 'sc-tick'}, value));
      }
      const points = (key, y) => rows.map((row, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(row[key]).toFixed(2)}`).join(' ');
      svg.append(svgNode('path', {d: `${points('unemployment', rateY)} L${x(35)},${rateBottom} L${x(0)},${rateBottom} Z`, fill: colors.unemployment, opacity: '.07'}));
      for (const key of ['ow', 'odsp', 'unemployment']) {
        const y = key === 'unemployment' ? rateY : caseY;
        svg.append(svgNode('path', {d: points(key, y), fill: 'none', stroke: colors[key], 'stroke-width': '2.4', 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}));
        svg.append(svgNode('circle', {'data-series-point': key, cx: x(selected), cy: y(rows[selected][key]), r: 5, fill: colors[key], stroke: '#fffdf8', 'stroke-width': '2'}));
      }
      const years = compact ? [2017, 2019, 2021, 2023, 2025] : Array.from({length: 9}, (_, i) => 2017 + i);
      years.forEach(year => {
        const i = (year - 2017) * 4;
        svg.append(svgNode('text', {x: x(i), y: height - 8, 'text-anchor': 'middle', class: 'sc-tick'}, year));
      });
      svg.addEventListener('click', event => {
        const bounds = svg.getBoundingClientRect();
        const px = (event.clientX - bounds.left) * width / bounds.width;
        select(Math.round((px - left) / (width - left - right) * 35));
      });
      chart.replaceChildren(svg);
    }

    function select(index) {
      selected = Math.max(0, Math.min(rows.length - 1, Number.isFinite(index) ? Math.round(index) : 12));
      const row = rows[selected], previous = rows[selected - 4];
      container.dataset.year = String(row.year);
      container.dataset.quarter = String(row.quarter);
      yearSelect.value = String(row.year);
      range.value = String(selected);
      range.setAttribute('aria-valuetext', `${quarterLabel(row)}；OW ${fmt(row.ow)} 件，ODSP ${fmt(row.odsp)} 件，失业率 ${fmt(row.unemployment, 1)}%`);
      quarterButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.quarter) === row.quarter)));
      $(`#${prefix}-selected`).textContent = `${quarterLabel(row)} · ${seasons[row.quarter - 1]}`;
      $(`#${prefix}-time`).textContent = `${row.year} Q${row.quarter}`;
      for (const key of ['ow', 'odsp', 'unemployment']) {
        const rate = key === 'unemployment';
        $(`[data-value="${key}"]`).textContent = `${fmt(row[key], rate ? 1 : 0)}${rate ? '%' : ''}`;
        $(`[data-change="${key}"]`).textContent = previous
          ? `同比 ${signed(rate ? row[key] - previous[key] : 100 * (row[key] / previous[key] - 1))}${rate ? ' 个百分点' : '%'}`
          : '同比：本图无上年数据';
      }
      $('[data-announcement]').textContent = range.getAttribute('aria-valuetext');
      container.querySelectorAll('[data-row]').forEach(element => element.classList.toggle('sc-selected-row', Number(element.dataset.row) === selected));
      if (!container.hidden) draw();
    }

    function hide() {
      if (container.hidden) return;
      container.hidden = true;
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
    }
    function back() { hide(); onBack(); }
    $('[data-back]').addEventListener('click', back);
    quarterButtons.forEach(button => button.addEventListener('click', () => select((Number(yearSelect.value) - 2017) * 4 + Number(button.dataset.quarter) - 1)));
    yearSelect.addEventListener('change', () => select((Number(yearSelect.value) - 2017) * 4 + rows[selected].quarter - 1));
    range.addEventListener('input', () => select(Number(range.value)));
    container.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); back(); }
      if (event.key !== 'Tab') return;
      const items = [...container.querySelectorAll('button, select, input, a[href], summary, [tabindex="0"]')]
        .filter(element => element.getClientRects().length && !element.disabled);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === $(`#${prefix}-title`))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
    const resize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { if (!container.hidden) draw(); });
    };
    if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(chart);
    else window.addEventListener('resize', resize);
    select(selected);
    return {
      show(index) {
        if (container.hidden) { previousFocus = document.activeElement; previousOverflow = document.body.style.overflow; }
        container.hidden = false;
        document.body.style.overflow = 'hidden';
        container.scrollTop = 0;
        select(12 + Math.max(0, Math.min(3, Number.isFinite(index) ? Math.floor(index) : 0)));
        $(`#${prefix}-title`).focus({preventScroll: true});
      },
      hide,
      get selected() { return {...rows[selected]}; },
      data: rows
    };
  };
})();
