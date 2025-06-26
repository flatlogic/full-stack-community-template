const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

const ExecutorService = require('../services/executor');

const wrapAsync = require('../helpers').wrapAsync;

const router = express.Router();

router.post(
    '/read_project_tree',
    wrapAsync(async (req, res) => {
        const { path } = req.body;
        const tree = await ExecutorService.readProjectTree(path);
        res.status(200).send(tree);
    }),
);

router.post(
    '/read_file',
    wrapAsync(async (req, res) => {
        const { path, showLines } = req.body;
        const content = await ExecutorService.readFileContents(path, showLines);
        res.status(200).send(content);
    }),
);

router.post(
    '/count_file_lines',
    wrapAsync(async (req, res) => {
        const { path } = req.body;
        const content = await ExecutorService.countFileLines(path);
        res.status(200).send(content);
    }),
);

// router.post(
//     '/read_file_header',
//     wrapAsync(async (req, res) => {
//         const { path, N } = req.body;
//         try {
//             const header = await ExecutorService.readFileHeader(path, N);
//             res.status(200).send(header);
//         } catch (error) {
//             res.status(500).send({
//                 error: true,
//                 message: error.message,
//                 details: error.details || error.stack,
//                 validation: error.validation
//             });
//         }
//     }),
// );

router.post(
    '/read_file_line_context',
    wrapAsync(async (req, res) => {
        const { path, lineNumber, windowSize, showLines } = req.body;
        try {
            const context = await ExecutorService.readFileLineContext(path, lineNumber, windowSize, showLines);
            res.status(200).send(context);
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message,
                details: error.details || error.stack,
                validation: error.validation
            });
        }
    }),
);

router.post(
    '/write_file',
    wrapAsync(async (req, res) => {
        const { path, fileContents, comment } = req.body;
        try {
            await ExecutorService.writeFile(path, fileContents, comment);
            res.status(200).send({ message: 'File written successfully' });
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message,
                details: error.details || error.stack,
                validation: error.validation
            });
        }
    }),
);

router.post(
    '/insert_file_content',
    wrapAsync(async (req, res) => {
        const { path, lineNumber, newContent, message } = req.body;
        try {
            await ExecutorService.insertFileContent(path, lineNumber, newContent, message);
            res.status(200).send({ message: 'File written successfully' });
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message,
                details: error.details || error.stack,
                validation: error.validation
            });
        }
    }),
);

router.post(
    '/replace_file_line',
    wrapAsync(async (req, res) => {
        const { path, lineNumber, newText } = req.body;
        try {
            const result = await ExecutorService.replaceFileLine(path, lineNumber, newText);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message,
                details: error.details || error.stack,
                validation: error.validation
            });
        }
    }),
);
router.post(
    '/replace_file_chunk',
    wrapAsync(async (req, res) => {
        const { path, startLine, endLine, newCode } = req.body;
        try {
            const result = await ExecutorService.replaceFileChunk(path, startLine, endLine, newCode);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message,
                details: error.details || error.stack,
                validation: error.validation
            });
        }
    }),
);

router.post(
    '/delete_file_lines',
    wrapAsync(async (req, res) => {
        const { path, startLine, endLine, message } = req.body;
        try {
            const result = await ExecutorService.deleteFileLines(path, startLine, endLine, message);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message,
                details: error.details || error.stack,
                validation: error.validation
            });
        }
    }),
);

router.post(
    '/validate_file',
    wrapAsync(async (req, res) => {
        const { path } = req.body;
        try {
            const validationResult = await ExecutorService.validateFile(path);
            res.status(200).send({ validationResult });
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message,
                details: error.details || error.stack,
                validation: error.validation
            });
        }
    }),
);


router.post(
  '/check_frontend_runtime_error',
  wrapAsync(async (req, res) => {
    try {
      const result =  await ExecutorService.checkFrontendRuntimeLogs();
      res.status(200).send(result);
    } catch (error) {
      res.status(500).send({ error: error });
    }
  }),
);


router.post(
    '/replace_code_block',
    wrapAsync(async (req, res) => {
        const {path, oldCode, newCode, message} = req.body;
        try {
            const response = await ExecutorService.replaceCodeBlock(path, oldCode, newCode, message);
            res.status(200).send(response);
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message,
                details: error.details || error.stack,
                validation: error.validation
            })
        }
    })
)

router.post('/update_project_files_from_scheme',
    upload.single('file'), // 'file' - name of the field in the form
    async (req, res) => {
        console.log('Request received');
        console.log('Headers:', req.headers);
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File info:', {
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        try {
            console.log('Starting update process...');
            const result = await ExecutorService.updateProjectFilesFromScheme(req.file.path);
            console.log('Update completed, result:', result);

            console.log('Removing temp file...');
            fs.unlinkSync(req.file.path);
            console.log('Temp file removed');

            console.log('Sending response...');
            return res.json(result);
        } catch (error) {
            console.error('Error in route handler:', error);
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('Temp file removed after error');
                } catch (unlinkError) {
                    console.error('Error removing temp file:', unlinkError);
                }
            }
            console.error('Update project files error:', error);
            return res.status(500).json({
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
);

router.post(
    '/get_db_schema',
    wrapAsync(async (req, res) => {
        try {

            const jsonSchema = await ExecutorService.getDBSchema();
            res.status(200).send({ jsonSchema });
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }),
);

router.post(
    '/execute_sql',
    wrapAsync(async (req, res) => {
        try {
            const { query } = req.body;
            const result =  await ExecutorService.executeSQL(query);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }),
);

router.post(
    '/search_files',
    wrapAsync(async (req, res) => {
        try {
            const { searchStrings } = req.body;

            if (
                typeof searchStrings !== 'string' &&
                !(
                    Array.isArray(searchStrings) &&
                    searchStrings.every(item => typeof item === 'string')
                )
            ) {
                return res.status(400).send({ error: 'searchStrings must be a string or an array of strings' });
            }

            const result = await ExecutorService.searchFiles(searchStrings);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    }),
);

router.use('/', require('../helpers').commonErrorHandler);

module.exports = router;
