import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

const extensions = ['.js', '.ts'];

export default {
    input: ['lib/api.ts', 'lib/cli.ts'],
    output: {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
    },
    plugins: [
        json(),
        resolve({ extensions }),
        commonjs(),
        babel({ babelHelpers: 'bundled', extensions }),
    ],
};
