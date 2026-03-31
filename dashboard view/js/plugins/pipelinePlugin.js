import { createKpiCard } from '../components/kpiCard.js';
import { createSpeedometer } from '../components/speedometer.js';
import {
  renderBarChart,
  renderLineChart,
  renderDonutChart,
  renderHeatmap
} from '../charts/dmoCharts.js';

function sumEntityCounts(entityCounts = {}) {
  return Object.values(entityCounts).reduce((sum, count) => sum + Number(count || 0), 0);
}

function estimateRate(totalRecords, fileCount) {
  const ingestRate = Math.min(1000, totalRecords * 40);
  const validationRate = Math.min(1000, Math.round(ingestRate * 1.1));
  const writeRate = Math.min(1000, Math.max(100, fileCount * 120));
  return { ingestRate, validationRate, writeRate };
}

function chartCard(title, type) {
  const card = document.createElement('section');
  card.className = 'chart-card';
  card.innerHTML = `<div class="chart-title">${title}</div><div class="chart-type">${type}</div><div class="chart-body"></div>`;
  return card;
}

export function pipelinePlugin(root) {
  const topbar = document.createElement('section');
  topbar.className = 'topbar';

  const titlePanel = document.createElement('article');
  titlePanel.className = 'panel';
  titlePanel.innerHTML = `
    <div class="headline">
      <h1>Data Console • SIEM Dashboard</h1>
    </div>
    <div class="legend">Clean runtime monitoring with semantic DMO analytics.</div>
    <button class="run-btn" id="runIngestBtn">Run Ingest</button>
  `;

  const csvCard = createKpiCard({ title: 'Active CSV Streams', value: '0' });
  const objectCard = createKpiCard({ title: 'Objects in Lake', value: '0' });
  const healthCard = createKpiCard({ title: 'Pipeline Health', value: 'READY', tone: 'warn' });

  topbar.append(titlePanel, csvCard, objectCard, healthCard);

  const main = document.createElement('section');
  main.className = 'main-single';

  const processPanel = document.createElement('article');
  processPanel.className = 'panel process-panel compact';
  processPanel.innerHTML = `
    <div class="title">Pipeline Runtime</div>
    <div class="legend tiny">[ Ingestion Files ] → [ Data Streams ] → [ DLO ] → [ DMO ]</div>
    <div class="pipeline-runtime" id="pipelineRuntime">
      <div class="pipeline-node" data-node="files">Ingestion Files</div>
      <div class="pipeline-node" data-node="streams">Data Streams</div>
      <div class="pipeline-node" data-node="dlo">DLO</div>
      <div class="pipeline-node" data-node="dmo">DMO</div>
    </div>
    <div class="file-processing-list" id="fileProcessingList"></div>
  `;

  const speedPanel = document.createElement('article');
  speedPanel.className = 'panel compact';
  speedPanel.innerHTML = `<div class="title">Speedometers</div><div class="legend tiny">Ingest, validate, and lake write rates.</div>`;

  const ingestGauge = createSpeedometer({ label: 'Ingest', value: 0, max: 1000, unit: ' r/m' });
  const validationGauge = createSpeedometer({ label: 'Validate', value: 0, max: 1000, unit: ' r/m' });
  const writeGauge = createSpeedometer({ label: 'Write', value: 0, max: 1000, unit: ' r/m' });

  const gaugeGrid = document.createElement('div');
  gaugeGrid.className = 'gauge-grid';
  gaugeGrid.append(ingestGauge.element, validationGauge.element, writeGauge.element);
  speedPanel.append(gaugeGrid);

  const chartsPanel = document.createElement('article');
  chartsPanel.className = 'panel charts-panel compact';
  chartsPanel.innerHTML = `<div class="title">Customers Analysis</div><div class="charts-grid"></div>`;
  const chartsGrid = chartsPanel.querySelector('.charts-grid');

  const purchasesCard = chartCard('Purchases by Customer', 'Bar');
  const conversionCard = chartCard('Conversion vs Abandonment', 'Bar');
  const funnelCard = chartCard('Funnel Stage Totals', 'Line');
  const engagementCard = chartCard('Client Categories', 'Donut');
  const heatmapCard = chartCard('Customer × Rate', 'Heatmap');

  chartsGrid.append(engagementCard, purchasesCard, conversionCard, funnelCard, heatmapCard);

  const aiPanel = document.createElement('article');
  aiPanel.className = 'panel compact';
  aiPanel.innerHTML = `
    <div class="title">AI Summary</div>
    <div class="ai-summary-rect">
      <div class="ai-headline" id="aiHeadline">No insight yet.</div>
      <div class="ai-summary" id="aiSummary">Run ingest to generate semantic + AI summary.</div>
      <div class="ai-subblocks">
        <section class="ai-subblock">
          <div class="ai-subtitle">Alerts</div>
          <ul class="ai-list" id="aiAlerts"></ul>
        </section>
        <section class="ai-subblock">
          <div class="ai-subtitle">Actions</div>
          <ul class="ai-list" id="aiActions"></ul>
        </section>
      </div>
    </div>
  `;

  main.append(processPanel, speedPanel, chartsPanel, aiPanel);
  root.append(topbar, main);

  const [csvValueNode] = csvCard.querySelectorAll('.value');
  const [objectValueNode] = objectCard.querySelectorAll('.value');
  const [healthValueNode] = healthCard.querySelectorAll('.value');
  const runButton = titlePanel.querySelector('#runIngestBtn');
  const runtimeNode = processPanel.querySelector('#pipelineRuntime');
  const pipelineNodes = Array.from(processPanel.querySelectorAll('.pipeline-node'));
  const aiHeadline = aiPanel.querySelector('#aiHeadline');
  const aiSummary = aiPanel.querySelector('#aiSummary');
  const aiAlerts = aiPanel.querySelector('#aiAlerts');
  const aiActions = aiPanel.querySelector('#aiActions');
  const fileProcessingList = processPanel.querySelector('#fileProcessingList');
  const csvFiles = [
    'customers*.csv'
  ];

  function renderFileProcessingItems() {
    fileProcessingList.innerHTML = csvFiles
      .map((fileName) => `<div class="file-item" data-file="${fileName}">${fileName}</div>`)
      .join('');
  }

  function clearFileProcessingState() {
    fileProcessingList.querySelectorAll('.file-item').forEach((node) => {
      node.classList.remove('processing', 'done', 'failed');
    });
  }

  function clearPipelineNodeStates() {
    pipelineNodes.forEach((node) => node.classList.remove('active', 'done', 'failed', 'processing'));
    clearFileProcessingState();
  }

  function playPipelineSquares() {
    clearPipelineNodeStates();
    const fileItems = Array.from(fileProcessingList.querySelectorAll('.file-item'));

    pipelineNodes.forEach((node, index) => {
      setTimeout(() => {
        node.classList.add('active', 'processing');
      }, index * 260);
      setTimeout(() => {
        node.classList.remove('active', 'processing');
        node.classList.add('done');
      }, index * 260 + 220);
    });

    fileItems.forEach((item, index) => {
      setTimeout(() => item.classList.add('processing'), index * 180);
      setTimeout(() => {
        item.classList.remove('processing');
        item.classList.add('done');
      }, index * 180 + 150);
    });
  }

  function setPipelineState(state) {
    runtimeNode.classList.remove('is-running', 'is-finished', 'is-failed');
    if (state) runtimeNode.classList.add(state);

    if (state === 'is-running') {
      playPipelineSquares();
    } else if (state === 'is-failed') {
      clearPipelineNodeStates();
      pipelineNodes.forEach((node) => node.classList.add('failed'));
      fileProcessingList.querySelectorAll('.file-item').forEach((node) => node.classList.add('failed'));
    }
  }

  function renderAiSummary(managerInsights = {}) {
    aiHeadline.textContent = managerInsights.headline || 'No insight yet.';
    aiSummary.textContent = managerInsights.summary || 'Run ingest to generate semantic + AI summary.';

    aiAlerts.innerHTML = '';
    (managerInsights.alerts || []).forEach((item) => {
      const li = document.createElement('li');
      const text = typeof item === 'object' ? JSON.stringify(item) : String(item);
      li.className = 'alert-item';
      li.textContent = text;
      aiAlerts.append(li);
    });

    aiActions.innerHTML = '';
    (managerInsights.recommendedActions || []).forEach((item) => {
      const li = document.createElement('li');
      const text = typeof item === 'object' ? JSON.stringify(item) : String(item);
      li.className = 'action-item';
      li.textContent = text;
      aiActions.append(li);
    });
  }

  function renderAnalyticsCharts(analytics) {
    const charts = analytics?.charts || {};

    renderBarChart(
      purchasesCard.querySelector('.chart-body'),
      (charts.purchasesByCustomer || []).map((item) => ({ label: item.customer, value: item.value })),
      { decimals: 1 }
    );
    renderBarChart(
      conversionCard.querySelector('.chart-body'),
      (charts.conversionByCustomer || []).map((item) => ({ label: item.customer, value: item.conversionRate })),
      { decimals: 1, unit: '%' }
    );
    renderLineChart(
      funnelCard.querySelector('.chart-body'),
      (charts.funnelStageTotals || []).map((item) => ({ label: item.step, value: item.value }))
    );
    renderDonutChart(
      engagementCard.querySelector('.chart-body'),
      (charts.engagementByCustomer || []).map((item) => ({ label: item.category, value: item.customers }))
    );
    renderHeatmap(heatmapCard.querySelector('.chart-body'), charts.heatmap || []);

    renderAiSummary(analytics.managerInsights || {});
  }

  function resetMetrics() {
    processPanel.hidden = false;
    csvValueNode.textContent = '0';
    objectValueNode.textContent = '0';
    healthValueNode.textContent = 'READY';
    ingestGauge.setValue(0);
    validationGauge.setValue(0);
    writeGauge.setValue(0);
    setPipelineState('');
    renderAnalyticsCharts({ charts: {}, managerInsights: {} });
  }

  async function runIngest() {
    processPanel.hidden = false;
    runButton.disabled = true;
    runButton.textContent = 'Running...';
    healthValueNode.textContent = 'RUNNING';
    healthValueNode.className = 'value warn';
    setPipelineState('is-running');

    try {
      const response = await fetch('/api/ingest', { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      const summary = payload.summary || {};
      const analytics = payload.analytics || {};
      const fileCount = (summary.processedCsvFiles || []).length;
      const entityCounts = summary.entityCounts || {};
      const totalRecords = sumEntityCounts(entityCounts);
      const rates = estimateRate(totalRecords, fileCount);

      csvValueNode.textContent = String(fileCount);
      objectValueNode.textContent = String(totalRecords);
      healthValueNode.textContent = 'HEALTHY';
      healthValueNode.className = 'value ok';

      ingestGauge.setValue(rates.ingestRate);
      validationGauge.setValue(rates.validationRate);
      writeGauge.setValue(rates.writeRate);

      processPanel.hidden = true;
      renderAnalyticsCharts(analytics);
      setPipelineState('is-finished');
    } catch (error) {
      healthValueNode.textContent = 'FAILED';
      healthValueNode.className = 'value bad';
      setPipelineState('is-failed');
      console.error(error);
    } finally {
      runButton.disabled = false;
      runButton.textContent = 'Run Ingest';
    }
  }

  renderFileProcessingItems();
  runButton.addEventListener('click', runIngest);
  resetMetrics();
}
