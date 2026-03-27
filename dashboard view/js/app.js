import { pipelinePlugin } from './plugins/pipelinePlugin.js';

const app = document.getElementById('app');
const plugins = [pipelinePlugin];
plugins.forEach((plugin) => plugin(app));
