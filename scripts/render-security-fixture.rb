# frozen_string_literal: true

require 'erb'
require 'active_support/core_ext/string/inflections'
require 'json'
require 'fileutils'
require 'pathname'

root = File.expand_path('..', __dir__)
target = File.join(root, '.security-fixture')
@schema = {
  '@backend' => 'nodejs2',
  'entities' => [],
  'migrations' => [],
  'project' => {
    '@title' => 'Security Fixture',
    '@backend' => 'nodejs2',
    '@db' => 'postgresql',
    '@project_uuid' => 'security-fixture-only',
    'project_id' => 'security-fixture'
  }
}
@entities = [{'@name' => 'users', '@name_cap' => 'Users', 'fields' => []}]
@fields = []
@all_fields = []
@project_with_web_site = false
@component_types = []
@db = 'postgresql'

FileUtils.rm_rf(target)
%w[frontend backend app-shell].each do |part|
  source = File.join(root, part)
  Dir.glob(File.join(source, '**', '*'), File::FNM_DOTMATCH).sort.each do |file|
    if File.directory?(file)
      next
    end
    relative = Pathname.new(file).relative_path_from(Pathname.new(root)).to_s
    if relative.split('/').any? { |piece| %w[node_modules build out .next].include?(piece) }
      next
    end
    if relative.include?('{{') || relative.include?('((')
      next
    end
    output = File.join(target, relative.sub(/\.erb$/, ''))
    FileUtils.mkdir_p(File.dirname(output))
    if file.end_with?('.erb')
      begin
        File.write(output, ERB.new(File.read(file), trim_mode: '-').result(binding))
      rescue StandardError
        warn "Failed rendering #{relative}"
        raise
      end
    else
      FileUtils.cp(file, output)
    end
  end
  modules = File.join(source, 'node_modules')
  if File.directory?(modules)
    FileUtils.ln_s(modules, File.join(target, part, 'node_modules'))
  end
end
puts "Rendered minimal PostgreSQL fixture to #{target}"

# The shared profile/avatar pages require the standard generated users store.
slice = File.read(File.join(root, 'frontend/src/stores/{{name}}/((name))Slice.ts.erb'))
slice = slice.gsub('((name))', 'users').gsub('((Name))', 'Users')
output = File.join(target, 'frontend/src/stores/users/usersSlice.ts')
FileUtils.mkdir_p(File.dirname(output))
File.write(output, ERB.new(slice, trim_mode: '-').result(binding))

# Exercise the real adapter and field callback without a third-party cloud key.
editor_page = <<~TSX
  import React, {useState} from 'react';
  import {RichTextField} from '../components/RichTextField';
  export default function SecurityEditorFixture() {
    const [value,setValue] = useState('');
    return <main><h1>Security editor fixture</h1>
      <RichTextField options={{}} field={{name:'content',value}}
        form={{setFieldValue:(_name,next) => setValue(next)}} itemRef={null} showField={true}
        tinymceScriptSrc="/security-tinymce/tinymce.min.js" licenseKey="gpl" />
      <output aria-label="Editor value">{value}</output>
    </main>;
  }
TSX
File.write(File.join(target, 'frontend/src/pages/security-editor.tsx'), editor_page)
editor_assets = File.join(root, 'frontend/node_modules/tinymce')
if File.directory?(editor_assets)
  output = File.join(target, 'frontend/public/security-tinymce')
  FileUtils.mkdir_p(output)
  %w[tinymce.min.js icons models plugins skins themes].each do |asset|
    FileUtils.cp_r(File.join(editor_assets, asset), output)
  end
end
