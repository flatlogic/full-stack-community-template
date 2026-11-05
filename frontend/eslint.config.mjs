import tsPlugin from '@typescript-eslint/eslint-plugin';
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const compat = new FlatCompat({baseDirectory:path.dirname(fileURLToPath(import.meta.url))});
export default [
  {ignores:['build/**','out/**','next-env.d.ts']},
  ...compat.extends('next/core-web-vitals'),
  {plugins:{'@typescript-eslint':tsPlugin}},
];
