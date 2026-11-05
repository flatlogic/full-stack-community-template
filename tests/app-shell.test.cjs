const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {createRequire} = require('node:module');
const shellRequire = createRequire(path.resolve('app-shell/package.json'));
const fixture = path.resolve('.security-fixture');

// Exercise real executor routes and a read-only local PostgreSQL connection; never initialize VCS.
test('executor preserves project authentication, JSON parsing and file reads', async () => {
  process.env.NODE_ENV = 'production';
  process.env.DB_USER = 'postgres';
  process.env.DB_NAME = 'postgres';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  const express = shellRequire('express');
  const parser = shellRequire('body-parser');
  const permission = require(path.join(fixture, 'app-shell/src/middlewares/check-permissions'));
  const modifyPath = require(path.join(fixture, 'app-shell/src/middlewares/modify-path'));
  const routes = require(path.join(fixture, 'app-shell/src/routes/executor'));
  const database = require(path.join(fixture, 'app-shell/src/services/database'));
  assert.equal((await database.executeSQL('SELECT 1 AS connected')).rows[0].connected, 1);
  const app = express();
  app.use(parser.json());
  app.use(permission);
  app.use(modifyPath);
  app.use('/executor', routes);
  const upload = require(path.join(fixture,'backend/src/middlewares/upload'));
  app.post('/upload', (req,res,next) => {
    upload(req,res).then(() => res.json({name:req.file.originalname,content:req.file.buffer.toString()}),next);
  });
  app.use((error,req,res,next) => res.status(400).json({code:error.code}));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/executor/read_file`;
    let response = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({path:'frontend/package.json'})});
    assert.equal(response.status, 403);
    response = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json','X-Project-UUID':'security-fixture-only'}, body:JSON.stringify({path:'frontend/package.json'})});
    assert.equal(response.status, 200);
    assert.equal((await response.json()).dependencies.next, '15.5.29');
    const form = new FormData();
    form.append('file',new Blob(['security fixture upload']), 'fixture.txt');
    response = await fetch(`http://127.0.0.1:${server.address().port}/upload`,{method:'POST',headers:{'X-Project-UUID':'security-fixture-only'},body:form});
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{name:'fixture.txt',content:'security fixture upload'});
    const invalid = new FormData();
    invalid.append('unexpected',new Blob(['reject']), 'fixture.txt');
    response = await fetch(`http://127.0.0.1:${server.address().port}/upload`,{method:'POST',headers:{'X-Project-UUID':'security-fixture-only'},body:invalid});
    assert.equal(response.status,400);
    assert.equal((await response.json()).code,'LIMIT_UNEXPECTED_FILE');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await database.close();
  }
});

test('backend token helper signs verifiable expiring JWTs and rejects tampering', () => {
  process.env.SECRET_KEY = 'security-fixture-key-never-used-in-production';
  const backendRequire = createRequire(path.join(fixture, 'backend/package.json'));
  const helper = backendRequire('./src/helpers');
  const jwt = backendRequire('jsonwebtoken');
  const token = helper.jwtSign({id:42});
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  assert.equal(decoded.id,42);
  assert.equal(decoded.exp - decoded.iat,21600);
  assert.throws(() => jwt.verify(token+'tampered',process.env.SECRET_KEY));
});

test('generated backend manifest matches the dependency lock context', () => {
  const generated = JSON.parse(fs.readFileSync(path.join(fixture,'backend/package.json')));
  const installed = JSON.parse(fs.readFileSync('backend/package.json'));
  assert.deepEqual(generated.dependencies,installed.dependencies);
  assert.equal(generated.dependencies['body-parser'],'1.20.9');
  assert.ok(!generated.dependencies.formidable);
});

// Sequelize still calls UUID.v1/v4 through its CommonJS API after the scoped security update.
test('Sequelize UUID defaults and Swagger glob discovery retain their APIs', () => {
  const backendRequire = createRequire(path.join(fixture, 'backend/package.json'));
  const {Sequelize, DataTypes} = backendRequire('sequelize');
  const sequelize = new Sequelize('postgres://localhost/security_fixture', {logging:false});
  const Record = sequelize.define('security_fixture', {id:{type:DataTypes.UUID, defaultValue:DataTypes.UUIDV4, primaryKey:true}});
  assert.match(Record.build().id, /^[a-f0-9-]{36}$/);
  const swagger = backendRequire('swagger-jsdoc');
  const result = swagger({definition:{openapi:'3.0.0',info:{title:'Fixture',version:'1'}},apis:[path.join(fixture,'backend/src/**/*.js')]});
  assert.equal(result.openapi,'3.0.0');
});

test('updated watcher, editorconfig and formatter discover and match files', () => {
  const os = require('node:os');
  const {execFileSync} = require('node:child_process');
  const backendRequire = createRequire(path.join(fixture, 'backend/package.json'));
  const match = backendRequire('nodemon/lib/monitor/match');
  assert.equal(match(['src/server.js'], ['**/*.js'], 'js').result.length, 1);
  assert.equal(match(['src/server.css'], ['**/*.js'], 'js').result.length, 0);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-security-'));
  try {
    fs.writeFileSync(path.join(dir,'.editorconfig'),'root = true\n[*.js]\nindent_size = 2\n');
    fs.writeFileSync(path.join(dir,'sample.js'),'const value={answer:42};\n');
    const editorconfig = backendRequire('editorconfig');
    assert.equal(editorconfig.parseSync(path.join(dir,'sample.js')).indent_size,2);
    const cli = path.resolve('backend/node_modules/js-beautify/js/bin/js-beautify.js');
    const output = execFileSync(process.execPath,[cli,path.join(dir,'*.js')],{encoding:'utf8'});
    assert.match(output,/beautified/);
    assert.match(fs.readFileSync(path.join(dir,'sample.js'),'utf8'),/answer: 42/);
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test('bcrypt retains password verification after the native dependency update', async () => {
  const backendRequire = createRequire(path.join(fixture, 'backend/package.json'));
  const bcrypt = backendRequire('bcrypt');
  const hash = await bcrypt.hash('security-fixture-password',4);
  assert.equal(await bcrypt.compare('security-fixture-password',hash),true);
  assert.equal(await bcrypt.compare('incorrect-password',hash),false);
});
