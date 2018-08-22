// @flow

import mapboxgl from '../../src';
import accessToken from '../lib/access_token';
import { runTests, update, benchmarks } from '../benchmarks_controller';

mapboxgl.accessToken = accessToken;

window.mapboxglBenchmarks = window.mapboxglBenchmarks || {};

const version = process.env.BENCHMARK_VERSION;

function register(benchmark) {
    const name = benchmark.constructor.name;
    window.mapboxglBenchmarks[name] = window.mapboxglBenchmarks[name] || {};
    window.mapboxglBenchmarks[name][version] = benchmark;
}

function runBenchmarks() {
  const filter = window.location.hash.substr(1);
  let promise = Promise.resolve();

  for (const name in window.mapboxglBenchmarks) {
    if (filter && name !== filter)
    continue;

    const benchmark = { name, versions: [] };
    benchmarks.push(benchmark);

    for (const test in window.mapboxglBenchmarks[name]) {
      const version = {
        name: test,
        status: 'waiting',
        logs: [],
        samples: [],
        summary: {}
      };
      benchmark.versions.push(version);

      promise = promise.then(() => {
        version.status = 'running';
        update();

        return runTests(window.mapboxglBenchmarks[name][test], version);
      });
    }

    promise = promise.then(() => {
      update(true);
    });
  }
}

import Layout from '../benchmarks/layout';
import LayoutDDS from '../benchmarks/layout_dds';
import Paint from '../benchmarks/paint';
import PaintStates from '../benchmarks/paint_states';
import LayerBenchmarks from '../benchmarks/layers';
import Load from '../benchmarks/map_load';
import Validate from '../benchmarks/style_validate';
import StyleLayerCreate from '../benchmarks/style_layer_create';
import QueryPoint from '../benchmarks/query_point';
import QueryBox from '../benchmarks/query_box';
import ExpressionBenchmarks from '../benchmarks/expressions';
import FilterCreate from '../benchmarks/filter_create';
import FilterEvaluate from '../benchmarks/filter_evaluate';

const style = 'mapbox://styles/mapbox/streets-v10';
const center = [-77.032194, 38.912753];
const zooms = [4, 8, 11, 13, 15, 17];
const locations = zooms.map(zoom => ({center, zoom}));

register(new Paint(style, locations));
register(new QueryPoint(style, locations));
register(new QueryBox(style, locations));
register(new Layout(style));
register(new Validate(style));
register(new StyleLayerCreate(style));
ExpressionBenchmarks.forEach((Bench) => register(new Bench(style)));
register(new PaintStates(center));
LayerBenchmarks.forEach((Bench) => register(new Bench(style)));
register(new Load(style));
register(new LayoutDDS(style));
register(new FilterCreate(style));
register(new FilterEvaluate(style));

runBenchmarks();

import getWorkerPool from '../../src/util/global_worker_pool';

setTimeout(() => {
    // Ensure the global worker pool is never drained. Browsers have resource limits
    // on the max number of workers that can be created per page.
    // We do this async to avoid creating workers before the worker bundle blob
    // URL has been set up, which happens after this module is executed.
    getWorkerPool().acquire(-1);
}, 0);

export default mapboxgl;
