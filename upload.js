// const multer = require('multer');
// const path = require('path');
// // const jwtMiddleware = require('./middleware/jwtMiddleware');
// // const jwtMiddleware = require('./upload');
// // const upload = require('./middleware/jwtMiddleware');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/documents');
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   }
// });

// const upload = multer({ storage });

// app.get('/register/documents', jwtMiddleware, (req, res) => {
//   res.render('documents');
// });

// app.post('/register/documents', jwtMiddleware, upload.fields([
//   { name: 'passport', maxCount: 1 },
//   { name: 'id_card', maxCount: 1 },
//   { name: 'driving_license', maxCount: 1 }
// ]), async (req, res) => {
//   // You can store file paths in DB here
//   console.log('Uploaded files:', req.files);
//   res.send('Documents uploaded successfully!');
// });
