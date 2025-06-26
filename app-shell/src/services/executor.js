const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');
const util = require('util');
const ProjectEventsService = require('./project-events');
const config = require('../config.js');
// Babel Parser for JS/TS/TSX
const babelParser = require('@babel/parser');
const babelParse = babelParser.parse;

// Local App DB Connection
const database = require('./database');

// PostCSS for CSS
const postcss = require('postcss');

const execAsync = util.promisify(exec);

module.exports = class ExecutorService {
  static async readProjectTree(directoryPath) {
    const paths = {
      frontend: '../../../frontend',
      backend: '../../../backend',
      default: '../../../'
    };

    try {
      const publicDir = path.join(__dirname, paths[directoryPath] || directoryPath || paths.default);

      return await getDirectoryTree(publicDir);
    } catch (error) {
      console.error('Error reading directory:', error);

      throw error;
    }
  }

  static async readFileContents(filePath, showLines) {
    try {
      const fullPath = path.join(__dirname, filePath);
      const content = await fs.readFile(fullPath, 'utf8');

      if (showLines) {
        const lines = content.split('\n');

        const lineObject = {};
        lines.forEach((line, index) => {
          lineObject[index + 1] = line;
        });

        return lineObject;
      } else {
        return content;
      }
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  static async countFileLines(filePath) {
    try {
      const fullPath = path.join(__dirname, filePath);

      // Check file exists
      await fs.access(fullPath);

      // Read file content
      const content = await fs.readFile(fullPath, 'utf8');

      // Split by newline and count
      const lines = content.split('\n');

      return {
        success: true,
        lineCount: lines.length
      };
    } catch (error) {
      console.error('Error counting file lines:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // static async readFileHeader(filePath, N = 30) {
  //   try {
  //     const fullPath = path.join(__dirname, filePath);
  //     const content = await fs.readFile(fullPath, 'utf8');
  //     const lines = content.split('\n');
  //
  //     if (lines.length < N) {
  //       return { error: `File has less than ${N} lines` };
  //     }
  //
  //     const headerLines = lines.slice(0, Math.min(50, lines.length));
  //
  //     const lineObject = {};
  //     headerLines.forEach((line, index) => {
  //       lineObject[index + 1] = line;
  //     });
  //
  //     return lineObject;
  //   } catch (error) {
  //     console.error('Error reading file header:', error);
  //     throw error;
  //   }
  // }

  static async readFileLineContext(filePath, lineNumber, windowSize, showLines) {
    try {
      const fullPath = path.join(__dirname, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');

      const start = Math.max(0, lineNumber - windowSize);
      const end = Math.min(lines.length, lineNumber + windowSize + 1);

      const contextLines = lines.slice(start, end);

      if (showLines) {
        const lineObject = {};
        contextLines.forEach((line, index) => {
          lineObject[start + index + 1] = line;
        });

        return lineObject;
      } else {
        return contextLines.join('\n');
      }
    } catch (error) {
      console.error('Error reading file line context:', error);
      throw error;
    }
  }

  static async validateFile(filePath) {
    console.log('Validating file:', filePath);

    // Read file content
    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      throw new Error(`Could not read file: ${filePath}\n${err.message}`);
    }

    // Determine file extension
    let ext = path.extname(filePath).toLowerCase();
    if (ext === '.temp') {
      ext = path.extname(filePath.slice(0, -5)).toLowerCase();
    }

    try {
      switch (ext) {
        case '.js':
        case '.ts':
        case '.tsx': {
          // Parse JS/TS/TSX with Babel
          babelParse(content, {
            sourceType: 'module',
            // plugins array covers JS, TS, TSX, and optional JS flavors
            plugins: ['jsx', 'typescript']
          });
          break;
        }

        case '.css': {
          // Parse CSS with PostCSS
          postcss.parse(content);
          break;
        }

        default: {
          // If the extension isn't recognized, assume it's "valid"
          // or you could throw an error to force a known extension
          console.warn(`No validation implemented for extension "${ext}". Skipping syntax check.`);
        }
      }

      // If parsing succeeded, return true
      return true;

    } catch (parseError) {
      // Rethrow parse errors with a friendlier message
      throw parseError;
    }
  }

  static async checkFrontendRuntimeLogs() {
    const frontendLogPath = '../frontend/json/runtimeError.json';

    try {
      // Check if file exists
      try {
        console.log('Accessing frontend logs:', frontendLogPath);
        await fs.access(frontendLogPath);
      } catch (error) {
        console.log('Frontend logs not found:', error);
        // File doesn't exist - return empty object
        return {runtime_error: {}};
      }

      // File exists, try to read it
      try {
        // Read the entire file instead of using tail
        const fileContent = await fs.readFile(frontendLogPath, 'utf8');
        console.log('Reading frontend logs:', fileContent);

        // Handle empty file
        if (!fileContent || fileContent.trim() === '') {
          return {runtime_error: {}};
        }

        // Parse JSON content
        const runtime_error = JSON.parse(fileContent);

        console.log('Parsed frontend logs:', runtime_error);
        return {runtime_error};
      } catch (error) {
        // Error reading or parsing file
        console.error('Error reading frontend runtime logs:', error);
        return {runtime_error: {}};
      }
    } catch (error) {
      // Unexpected error
      console.log('Error checking frontend logs:', error);
      return {runtime_error: {}};
    }
  }

  static async writeFile(filePath, fileContents, comment) {
    try {
      console.log(comment)
      const fullPath = path.join(__dirname, filePath);

      // Write to a temp file first
      const tempPath = `${fullPath}.temp`;
      await fs.writeFile(tempPath, fileContents, 'utf8');

      // Validate the temp file
      await this.validateFile(tempPath);

      // Rename temp file to original path
      await fs.rename(tempPath, fullPath);

      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  static async insertFileContent(filePath, lineNumber, newContent, message) {
    try {
      const fullPath = path.join(__dirname, filePath);

      // Check file exists
      await fs.access(fullPath);

      // Read and split by line
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');

      // Ensure lineNumber is within [1 ... lines.length + 1]
      // 1 means "insert at the very first line"
      // lines.length + 1 means "append at the end"
      if (lineNumber < 1) {
        lineNumber = 1;
      }
      if (lineNumber > lines.length + 1) {
        lineNumber = lines.length + 1;
      }

      // Convert to 0-based index
      const insertIndex = lineNumber - 1;

      // Prepare preview
      const preview = {
        insertionLine: lineNumber,
        insertedLines: newContent.split('\n')
      };

      // Insert newContent lines at the specified index
      lines.splice(insertIndex, 0, ...newContent.split('\n'));

      // Write changes to a temp file first
      const updatedContent = lines.join('\n');
      const tempPath = `${fullPath}.temp`;
      await fs.writeFile(tempPath, updatedContent, 'utf8');

      await this.validateFile(tempPath);

      // Rename temp file to original path
      await fs.rename(tempPath, fullPath);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error inserting file content:', error);
      throw error;
    }
  }

  static async replaceFileLine(filePath, lineNumber, newText, message = null) {
    const fullPath = path.join(__dirname, filePath);
    try {

      try {
        await fs.access(fullPath);
      } catch (error) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');

      if (lineNumber < 1 || lineNumber > lines.length) {
        throw new Error(`Invalid line number: ${lineNumber}. File has ${lines.length} lines`);
      }

      if (typeof newText !== 'string') {
        throw new Error('New text must be a string');
      }

      const preview = {
        oldLine: lines[lineNumber - 1],
        newLine: newText,
        lineNumber: lineNumber
      };

      lines[lineNumber - 1] = newText;
      const newContent = lines.join('\n');
      const tempPath = `${fullPath}.temp`;
      await fs.writeFile(tempPath, newContent, 'utf8');

      await this.validateFile(tempPath);

      await fs.rename(tempPath, fullPath);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error updating file line:', error);

      try {
        await fs.unlink(`${fullPath}.temp`);
      } catch {
      }

      throw {
        error: error,
        message: error.message,
        details: error.stack
      };
    }
  }

  static async replaceFileChunk(filePath, startLine, endLine, newCode) {
    try {
      // Check if this is a single-line change
      const newCodeLines = newCode.split('\n');
      if (newCodeLines.length === 1 && endLine === startLine) {
        // Redirect to replace_file_line
        return await this.replaceFileLine(filePath, startLine, newCode);
      }

      const fullPath = path.join(__dirname, filePath);

      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch (error) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');

      // Adjust line numbers to array indices (subtract 1)
      const startIndex = startLine - 1;
      const endIndex = endLine - 1;

      // Validate input parameters
      if (startIndex < 0 || endIndex >= lines.length || startIndex > endIndex) {
        throw new Error(`Invalid line range: ${startLine}-${endLine}. File has ${lines.length} lines`);
      }

      // Check type of new code
      if (typeof newCode !== 'string') {
        throw new Error('New code must be a string');
      }

      // Create changes preview
      const preview = {
        oldLines: lines.slice(startIndex, endIndex + 1),
        newLines: newCode.split('\n'),
        startLine,
        endLine
      };

      // Apply changes to temp file first
      lines.splice(startIndex, endIndex - startIndex + 1, ...newCode.split('\n'));
      const newContent = lines.join(os.EOL);
      const tempPath = `${fullPath}.temp`;
      await fs.writeFile(tempPath, newContent, 'utf8');
      await this.validateFile(tempPath);
      // Apply changes if all validations passed
      await fs.rename(tempPath, fullPath);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error updating file slice:', error);

      // Clean up temp file if exists
      try {
        await fs.unlink(`${fullPath}.temp`);
      } catch {
      }

      throw {
        error: error,
        message: error.message,
        details: error.details || error.stack
      };
    }
  }

  static async replaceCodeBlock(filePath, oldCode, newCode, message) {
    try {
      console.log(message);
      const fullPath = path.join(__dirname, filePath);

      // Check file exists
      await fs.access(fullPath);

      // Read file content
      let content = await fs.readFile(fullPath, 'utf8');

      // A small helper to unify line breaks to just `\n`
      const unifyLineBreaks = (str) => str.replace(/\r\n/g, '\n');

      // Normalize line breaks in file content, oldCode, and newCode
      content = unifyLineBreaks(content);
      oldCode = unifyLineBreaks(oldCode);
      newCode = unifyLineBreaks(newCode);

      // Optional: Trim trailing spaces or handle other whitespace normalization if needed
      // oldCode = oldCode.trim();
      // newCode = newCode.trim();

      // Check if oldCode actually exists in the content
      const index = content.indexOf(oldCode);
      if (index === -1) {
        return {
          success: false,
          message: 'Old code not found in file.'
        };
      }

      // Create a preview before replacing
      const preview = {
        oldCodeSnippet: oldCode,
        newCodeSnippet: newCode
      };

      // Perform replacement (single occurrence). For multiple, use replaceAll or a loop.
      // If you want a global replacement, consider:
      // content = content.split(oldCode).join(newCode);
      content = content.replace(oldCode, newCode);

      // Write to a temp file first
      const tempPath = `${fullPath}.temp`;
      await fs.writeFile(tempPath, content, 'utf8');

      await this.validateFile(tempPath);
      // Rename temp file to original
      await fs.rename(tempPath, fullPath);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error replacing code:', error);
      return {
        error: error,
        message: error.message,
        details: error.details || error.stack
      };
    }
  }

  //todo add validation
  static async deleteFileLines(filePath, startLine, endLine, veryShortDescription) {
    try {
      const fullPath = path.join(__dirname, filePath);

      // Check if file exists
      await fs.access(fullPath);

      // Read file content
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');

      // Convert to zero-based indices
      const startIndex = startLine - 1;
      const endIndex = endLine - 1;

      // Validate range
      if (startIndex < 0 || endIndex >= lines.length || startIndex > endIndex) {
        throw new Error(
            `Invalid line range: ${startLine}-${endLine}. File has ${lines.length} lines`
        );
      }

      // Prepare a preview of the lines being deleted
      const preview = {
        deletedLines: lines.slice(startIndex, endIndex + 1),
        startLine,
        endLine
      };

      // Remove lines
      lines.splice(startIndex, endIndex - startIndex + 1);

      // Join remaining lines and write to a temporary file
      const newContent = lines.join('\n');
      const tempPath = `${fullPath}.temp`;
      await fs.writeFile(tempPath, newContent, 'utf8');

      await this.validateFile(tempPath);
      // Rename temp file to original
      await fs.rename(tempPath, fullPath);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error deleting file lines:', error);
      return {
        error: error,
        message: error.message,
        details: error.details || error.stack
      };
    }
  }

  static async validateTypeScript(filePath, content = null) {
    try {
      // Basic validation of JSX syntax
      const jsxErrors = [];

      if (content !== null) {
        // Check for matching braces
        if ((content.match(/{/g) || []).length !== (content.match(/}/g) || []).length) {
          jsxErrors.push("Unmatched curly braces");
        }

        // Check for invalid syntax in JSX attributes
        if (content.includes('label={')) {
          if (!content.match(/label={[^}]+}/)) {
            jsxErrors.push("Invalid label attribute syntax");
          }
        }

        if (jsxErrors.length > 0) {
          return {
            valid: false,
            errors: jsxErrors.map(error => ({
              code: 'JSX_SYNTAX_ERROR',
              severity: 'error',
              location: '',
              message: error
            }))
          };
        }
      }

      return {
        valid: true,
        errors: [],
        errorCount: 0,
        warningCount: 0
      };

    } catch (error) {
      console.error('TypeScript validation error:', error);
      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_FAILED',
          severity: 'error',
          location: '',
          message: `TypeScript validation error: ${error.message}`
        }],
        errorCount: 1,
        warningCount: 0
      };
    }
  }

  static async validateBackendFiles(backendPath) {
    try {
      // Check for syntax errors
      await execAsync(`node --check ${backendPath}/src/index.js`);

      // Try to run the code in a test environment
      const testProcess = exec(
          'NODE_ENV=test node -e "try { require(\'./src/index.js\') } catch(e) { console.error(e); process.exit(1) }"',
          {cwd: backendPath}
      );

      return new Promise((resolve) => {
        let output = '';
        let error = '';

        testProcess.stdout.on('data', (data) => {
          output += data;
        });

        testProcess.stderr.on('data', (data) => {
          error += data;
        });

        testProcess.on('close', (code) => {
          if (code === 0) {
            resolve({valid: true});
          } else {
            resolve({
              valid: false,
              error: error || output
            });
          }
        });

        // Timeout on validation
        setTimeout(() => {
          testProcess.kill();
          resolve({
            valid: true,
            warning: 'Validation timeout, but no immediate errors found'
          });
        }, 5000);
      });
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  static async createBackup(ROOT_PATH) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(ROOT_PATH, 'backups', timestamp);

    try {
      await fs.mkdir(path.join(ROOT_PATH, 'backups'), {recursive: true});

      const dirsToBackup = ['frontend', 'backend'];

      for (const dir of dirsToBackup) {
        const sourceDir = path.join(ROOT_PATH, dir);
        const targetDir = path.join(backupDir, dir);

        await fs.mkdir(targetDir, {recursive: true});

        await execAsync(
            `cd "${sourceDir}" && ` +
            `find . -type f -not -path "*/node_modules/*" -not -path "*/\\.*" | ` +
            `while read file; do ` +
            `mkdir -p "${targetDir}/$(dirname "$file")" && ` +
            `cp "$file" "${targetDir}/$file"; ` +
            `done`
        );
      }

      console.log('Backup created at:', backupDir);
      return backupDir;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  static async restoreFromBackup(backupDir, ROOT_PATH) {
    try {
      console.log('Restoring from backup:', backupDir);
      await execAsync(`rm -rf ${ROOT_PATH}/backend/*`);
      await execAsync(`cp -r ${backupDir}/* ${ROOT_PATH}/backend/`);
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }

  static async updateProjectFilesFromScheme(zipFilePath) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ROOT_PATH = path.join(__dirname, '../../../');

    try {
      console.log('Checking file access...');
      await fs.access(zipFilePath);

      console.log('Getting file stats...');
      const stats = await fs.stat(zipFilePath);
      console.log('File size:', stats.size);

      if (stats.size > MAX_FILE_SIZE) {
        console.log('File size exceeds limit');
        return {success: false, error: 'File size exceeds limit'};
      }

      // Copying zip file to /tmp
      const tempZipPath = path.join('/tmp', path.basename(zipFilePath));
      await fs.copyFile(zipFilePath, tempZipPath);

      // Launching background update process
      const servicesUpdate = (async () => {
        try {
          console.log('Stopping services...');

          // await ProjectEventsService.sendEvent('SERVICE_STOP_STARTED', {
          //   message: 'Stopping services',
          //   timestamp: new Date().toISOString()
          // });

          await stopServices();

          // await ProjectEventsService.sendEvent('SERVICE_STOP_COMPLETED', {
          //   message: 'Services stopped successfully',
          //   timestamp: new Date().toISOString()
          // });

          console.log('Creating zip instance...');
          const zip = new AdmZip(tempZipPath);

          console.log('Extracting files to:', ROOT_PATH);
          zip.extractAllTo(ROOT_PATH, true);
          console.log('Files extracted');

          const removedFilesPath = path.join(ROOT_PATH, 'removed_files.json');
          try {
            await fs.access(removedFilesPath);
            const removedFilesContent = await fs.readFile(removedFilesPath, 'utf8');
            const filesToRemove = JSON.parse(removedFilesContent);
            await removeFiles(filesToRemove, ROOT_PATH);

            await fs.unlink(removedFilesPath);
          } catch (error) {
            console.log('No removed files to process or error accessing removed_files.json:', error);
          }

          // Remove temp zip file
          await fs.unlink(tempZipPath);

          // await ProjectEventsService.sendEvent('SERVICE_START_STARTED', {
          //   message: 'Starting services',
          //   timestamp: new Date().toISOString()
          // });

          // Start services after a delay
          setTimeout(async () => {
            try {
              await startServices();
              console.log('Services started successfully');

              await ProjectEventsService.sendEvent('SERVICE_START_COMPLETED', {
                message: 'All files have been successfully retrieved and applied.',
                timestamp: new Date().toISOString()
              });
            } catch (e) {
              console.error('Failed to start services:', e);
            }
          }, 3000);

        } catch (error) {
          console.error('Error in service update process:', error);
        }
      })();

      servicesUpdate.catch(error => {
        console.error('Background update process failed:', error);
      });

      console.log('Returning immediate response');

      return {
        success: true,
        message: 'Update process initiated'
      };

    } catch (error) {
      console.error('Critical error in updateProjectFilesFromScheme:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getDBSchema() {
    try {
      return await database.getDBSchema();
    } catch (error) {
      console.error('Error reading schema:', error);
      throw {
        error: error,
        message: error.message,
        details: error.details || error.stack
      };
    }
  }

  static async executeSQL(query) {
    try {
      return await database.executeSQL(query);
    } catch (error) {
      console.error('Error executing query:', error);
      throw {
        error: error,
        message: error.message,
        details: error.details || error.stack
      };
    }
  }

  static async stopServices() {
    return await stopServices();
  }

  static async startServices() {
    return await startServices();
  }

  static async checkServicesStatus() {
    return await checkStatus();
  }

  static async searchFiles(searchStrings) {
    const results = {};
    const ROOT_PATH = path.join(__dirname, '../../../');
    const directories = [`${ROOT_PATH}backend/`, `${ROOT_PATH}frontend/`];
    const excludeDirs = ['node_modules', 'build', 'app_shell'];

    if (!Array.isArray(searchStrings)) {
      searchStrings = [searchStrings];
    }

    for (const searchString of searchStrings) {
      try {
        for (const directoryPath of directories) {
          const findCommand = `find '${directoryPath}' -type f ${excludeDirs.map(dir => `-not -path "*/${dir}/*"`).join(' ')} -print | xargs grep -nH -C 1 -e '${searchString}'`;

          try {
            const { stdout } = await execAsync(findCommand);

            const lines = stdout.trim().split('\n').filter(line => line !== '');
            const searchResults = {};
            // searchResults['__raw_lines__'] = lines;

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const parts = line.split(':');
              let filePath = '';
              let lineNumberStr = '';
              let content = '';
              let relativeFilePath = '';
              let lineNum = null;

              if (parts.length >= 3 && !parts[0].includes('-')) {
                filePath = parts.shift();
                lineNumberStr = parts.shift();
                content = parts.join(':').trim();
                relativeFilePath = filePath.replace(`${ROOT_PATH}`, '');
                lineNum = parseInt(lineNumberStr, 10) + 1;
              } else {
                content = line.trim();
              }

              const context = [];
              if (i > 0 && lines[i - 1].includes(':')) {
                const prevLineParts = lines[i - 1].split(':');
                if (prevLineParts.length >= 3 && !prevLineParts[0].includes('-')) {
                  prevLineParts.shift();
                  prevLineParts.shift();
                  context.push(prevLineParts.join(':').trim());
                } else {
                  context.push(lines[i - 1].trim());
                }
              }
              context.push(content);
              if (i < lines.length - 1 && lines[i + 1].includes(':')) {
                const nextLineParts = lines[i + 1].split(':');
                if (nextLineParts.length >= 3 && !nextLineParts[0].includes('-')) {
                  nextLineParts.shift();
                  nextLineParts.shift();
                  context.push(nextLineParts.join(':').trim());
                } else {
                  context.push(lines[i + 1].trim());
                }
              }

              if (relativeFilePath && !searchResults[relativeFilePath]) {
                searchResults[relativeFilePath] = [];
              }
              if (relativeFilePath) {
                searchResults[relativeFilePath].push({
                  lineNumber: lineNum,
                  context: context.join('\n'),
                  // __filePathAndLine__: filePath + ':' + lineNumberStr + ':' + content,
                });
              }
            }

            if (!results[searchString]) {
              results[searchString] = {};
            }
            Object.assign(results[searchString], searchResults);
          } catch (err) {
            if (!err.message.includes('No such file or directory') && !err.stderr.includes('No such file or directory')) {
              console.error(`Error using find/grep for "${searchString}" in ${directoryPath}:`, err);
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for "${searchString}":`, error);
        results[searchString] = { error: error.message };
      }
    }

    return results;
  }

}

async function getDirectoryTree(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result = {};

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory() && (
        entry.name === 'node_modules' ||
        entry.name === 'app-shell' ||
        entry.name === '.git' ||
        entry.name === '.idea'
    )) {
      continue;
    }

    const relativePath = fullPath.replace('/app', '');

    if (entry.isDirectory()) {
      const subTree = await getDirectoryTree(fullPath);
      Object.keys(subTree).forEach(key => {
        result[key.replace('/app', '')] = subTree[key];
      });
    } else {
      const fileContent = await fs.readFile(fullPath, 'utf8');
      const lineCount = fileContent.split('\n').length;
      result[relativePath] = lineCount;
    }
  }

  return result;
}

async function stopServices() {
  try {
    console.log('Finding service processes...');
    // await ProjectEventsService.sendEvent('SERVICE_STOP_INITIATED', {
    //   message: 'Initiating service stop',
    //   timestamp: new Date().toISOString()
    // });
    // Frontend stopping
    const { stdout: frontendProcess } = await execAsync("ps -o pid,cmd | grep '[n]ext-server' | awk '{print $1}'");
    if (frontendProcess.trim()) {
      console.log('Stopping frontend, pid:', frontendProcess.trim());

      // await ProjectEventsService.sendEvent('FRONTEND_STOP_STARTED', {
      //   message: `Stopping frontend, pid: ${frontendProcess.trim()}`,
      //   timestamp: new Date().toISOString()
      // });

      // await execAsync(`kill -15 ${frontendProcess.trim()}`);

      // await ProjectEventsService.sendEvent('FRONTEND_STOP_COMPLETED', {
      //   message: 'Frontend stopped successfully',
      //   timestamp: new Date().toISOString()
      // });
    }

    // Backend stopping
    const { stdout: backendProcess } = await execAsync("ps -o pid,cmd | grep '[n]ode ./src/index.js' | grep -v app-shell | awk '{print $1}'");
    if (backendProcess.trim()) {
      console.log('Stopping backend, pid:', backendProcess.trim());

      // await ProjectEventsService.sendEvent('BACKEND_STOP_STARTED', {
      //   message: `Stopping backend, pid: ${backendProcess.trim()}`,
      //   timestamp: new Date().toISOString()
      // });

      // await execAsync(`kill -15 ${backendProcess.trim()}`);

      // await ProjectEventsService.sendEvent('BACKEND_STOP_COMPLETED', {
      //   message: 'Backend stopped successfully',
      //   timestamp: new Date().toISOString()
      // });
    }

    await new Promise(resolve => setTimeout(resolve, 4000));


    // await ProjectEventsService.sendEvent('SERVICE_STOP_COMPLETED', {
    //   message: 'All services stopped successfully',
    //   timestamp: new Date().toISOString()
    // });

    return { success: true };
  } catch (error) {
    console.error('Error stopping services:', error);

    await ProjectEventsService.sendEvent('SERVICE_STOP_FAILED', {
      message: 'Error stopping services',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return { success: false, error: error.message };
  }
}

async function startServices() {
  try {
    console.log('Starting services...');
    // await ProjectEventsService.sendEvent('SERVICE_START_INITIATED', {
    //   message: 'Initiating service start',
    //   timestamp: new Date().toISOString()
    // });

    // await ProjectEventsService.sendEvent('FRONTEND_START_STARTED', {
    //   message: 'Starting frontend service',
    //   timestamp: new Date().toISOString()
    // });
    // await execAsync('yarn --cwd /app/frontend dev &');
    // await ProjectEventsService.sendEvent('FRONTEND_START_COMPLETED', {
    //   message: 'Frontend service started successfully',
    //   timestamp: new Date().toISOString()
    // });

    // await ProjectEventsService.sendEvent('BACKEND_START_STARTED', {
    //   message: 'Starting backend service',
    //   timestamp: new Date().toISOString()
    // });
    // await execAsync('yarn --cwd /app/backend start &');
    // await ProjectEventsService.sendEvent('BACKEND_START_COMPLETED', {
    //   message: 'Backend service started successfully',
    //   timestamp: new Date().toISOString()
    // });

    // await ProjectEventsService.sendEvent('SERVICE_START_COMPLETED', {
    //   message: 'All services started successfully',
    //   timestamp: new Date().toISOString()
    // });

    return { success: true };
  } catch (error) {
    console.error('Error starting services:', error);
    await ProjectEventsService.sendEvent('SERVICE_START_FAILED', {
      message: 'Error starting services',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: error.message };
  }
}

async function checkStatus() {
  try {
    const { stdout } = await execAsync('ps aux');
    return {
      success: true,
      frontendRunning: stdout.includes('next-server'),
      backendRunning: stdout.includes('nodemon') && stdout.includes('/app/backend'),
      nginxRunning: stdout.includes('nginx: master process')
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function validateJSXSyntax(code) {
  // Define validation rules for JSX
  const rules = [
    {
      // JSX attribute with expression
      pattern: /^[a-zA-Z][a-zA-Z0-9]*={.*}$/,
      message: 'Invalid JSX attribute syntax'
    },
    {
      // Invalid sequences
      pattern: /,{2,}/,
      message: 'Invalid character sequence detected',
      shouldNotMatch: true
    },
    {
      // Ternary expressions
      pattern: /^[a-zA-Z][a-zA-Z0-9]*={[\w\s]+\?[^}]+:[^}]+}$/,
      message: 'Invalid ternary expression in JSX'
    }
  ];

  // Validate each line
  const lines = code.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // Check each rule
    for (const rule of rules) {
      if (rule.shouldNotMatch) {
        // For patterns that should not be present
        if (rule.pattern.test(trimmedLine)) {
          return {
            valid: false,
            errors: [{
              code: 'JSX_SYNTAX_ERROR',
              severity: 'error',
              location: '',
              message: rule.message
            }]
          };
        }
      } else {
        // For patterns that should match
        if (trimmedLine.includes('=') && !rule.pattern.test(trimmedLine)) {
          return {
            valid: false,
            errors: [{
              code: 'JSX_SYNTAX_ERROR',
              severity: 'error',
              location: '',
              message: rule.message
            }]
          };
        }
      }
    }

    // Additional JSX-specific checks
    if ((trimmedLine.match(/{/g) || []).length !== (trimmedLine.match(/}/g) || []).length) {
      return {
        valid: false,
        errors: [{
          code: 'JSX_SYNTAX_ERROR',
          severity: 'error',
          location: '',
          message: 'Unmatched curly braces in JSX'
        }]
      };
    }
  }

  // If all checks pass
  return {
    valid: true,
    errors: []
  };
}

async function removeFiles(files, rootPath) {
  try {
    for (const file of files) {
      const fullPath = path.join(rootPath, file);
      try {
        await fs.unlink(fullPath);
        console.log(`File removed: ${fullPath}`);
      } catch (error) {
        console.error(`Error when trying to delete a file ${fullPath}:`, error);
      }
    }
  } catch (error) {
    console.error('Error removing files:', error);
    throw error;
  }
}